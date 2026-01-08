/**
 * College Overlay Service
 *
 * **The Sophisticated College-Specific Layer**
 *
 * This service provides the SAME level of depth as the universal layer but for
 * college-specific requirements. It handles:
 *
 * 1. **College Voice Calibration** - Each college has a "personality" that suggestions should match
 * 2. **Value-Aligned Cliché Detection** - Stanford-specific clichés differ from MIT's
 * 3. **College-Specific Elite Craft** - What makes writing "Stanford-quality" vs "MIT-quality"
 * 4. **Prompt-Specific Guidance** - Essay 1 vs Essay 2 have different requirements
 * 5. **Citation Integration** - When and how to naturally weave in Dean quotes
 * 6. **Red/Green Flag Awareness** - College-specific patterns to embrace or avoid
 *
 * **Key Principle**: Generic college advice creates generic essays.
 * Stanford wants "intellectual vitality." MIT wants "hands-on making."
 * Harvard wants "potential for impact." This service encodes those differences.
 */

import type { CollegeResearch, CollegeCoreValue, CollegeKeyQuote, CollegeRedFlag, CollegeGreenFlag, CollegeEssayPrompt } from '../types/collegeResearch';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';
import type { SupplementalDimension } from '../rubrics';

// ============================================================================
// TYPES
// ============================================================================

/**
 * College "personality" that shapes writing advice
 */
export interface CollegePersonality {
  college_id: string;
  college_name: string;

  // Voice characteristics
  preferred_tone: 'intellectual' | 'conversational' | 'ambitious' | 'humble' | 'quirky';
  formality_level: 'formal' | 'semi-formal' | 'casual';
  risk_tolerance: 'conservative' | 'moderate' | 'experimental';

  // What makes an essay "sound like" this college
  signature_qualities: string[];

  // Anti-patterns for this college
  college_specific_cliches: CollegeCliche[];

  // Elite craft markers specific to this college
  elite_craft_markers: CollegeEliteCraftMarker[];

  // How this college evaluates essays
  evaluation_philosophy: string;
}

/**
 * College-specific cliché (different from universal clichés)
 */
export interface CollegeCliche {
  pattern: RegExp;
  description: string;
  why_cliche: string;
  better_approach: string;
  severity: 'critical' | 'moderate' | 'minor';
  affects_values: string[];
}

/**
 * College-specific elite craft marker
 */
export interface CollegeEliteCraftMarker {
  marker: string;
  what_it_looks_like: string;
  why_this_college_values_it: string;
  example: string;
  anti_example: string;
}

/**
 * Prompt-specific guidance
 */
export interface PromptSpecificGuidance {
  prompt_id: string;
  prompt_title: string;

  // What this prompt REALLY assesses
  hidden_assessment: string;

  // Critical success factors
  must_demonstrate: string[];
  must_avoid: string[];

  // Structural guidance
  recommended_structure: {
    opening: string;
    body: string;
    closing: string;
  };

  // Word allocation
  word_allocation: {
    section: string;
    percentage: number;
    guidance: string;
  }[];

  // Specific red/green flags for this prompt
  prompt_red_flags: string[];
  prompt_green_flags: string[];
}

/**
 * College-aware context for prompts
 */
export interface CollegeContextForPrompt {
  // Basic info
  college_name: string;
  personality: CollegePersonality;

  // Prompt-specific
  prompt_guidance: PromptSpecificGuidance;

  // Values alignment
  values_to_demonstrate: {
    value: CollegeCoreValue;
    demonstration_guidance: string;
    sample_integration: string;
  }[];

  // Citations
  citation_opportunities: {
    quote: CollegeKeyQuote;
    natural_trigger: string;
    integration_template: string;
  }[];

  // Clichés to avoid
  cliches_to_avoid: CollegeCliche[];

  // Elite craft requirements
  elite_craft_requirements: CollegeEliteCraftMarker[];

  // Red/green flags
  red_flags: string[];
  green_flags: string[];
}

// ============================================================================
// COLLEGE PERSONALITIES
// ============================================================================

/**
 * Define personality for each supported college
 */
const COLLEGE_PERSONALITIES: Record<string, Partial<CollegePersonality>> = {
  stanford: {
    preferred_tone: 'intellectual',
    formality_level: 'semi-formal',
    risk_tolerance: 'experimental',
    signature_qualities: [
      'Shows energy and depth of thought',
      'Demonstrates self-directed exploration',
      'Voice sounds like genuine "geeking out"',
      'Questions that can\'t be easily answered',
      'Process-focused, not outcome-focused',
      'Comfortable with ambiguity and uncertainty',
    ],
    evaluation_philosophy: 'Stanford seeks students who pursue learning for its own sake. The "intellectual vitality" criterion is the primary differentiator. Essays should show HOW you think, not just WHAT you\'ve achieved.',
  },
  mit: {
    preferred_tone: 'conversational',
    formality_level: 'casual',
    risk_tolerance: 'experimental',
    signature_qualities: [
      'Hands-on making and building',
      'Collaborative problem-solving',
      'Comfort with failure and iteration',
      'Technical depth with human heart',
      'Quirky humor welcomed',
      'Shows you BUILD things, not just think about them',
    ],
    evaluation_philosophy: 'MIT values makers and doers. Essays should show you\'ve actually BUILT something, tried something, failed at something. Theory without application is incomplete. Collaboration is essential.',
  },
  harvard: {
    preferred_tone: 'ambitious',
    formality_level: 'semi-formal',
    risk_tolerance: 'moderate',
    signature_qualities: [
      'Potential for significant impact',
      'Leadership through service',
      'Intellectual range and depth',
      'Clear vision for contribution',
      'Demonstrates "veritas" - commitment to truth',
      'Shows awareness of larger world',
    ],
    evaluation_philosophy: 'Harvard seeks future leaders who will make a difference. Essays should show a trajectory from who you are to who you\'ll become. Impact matters, but so does how you got there.',
  },
};

// ============================================================================
// COLLEGE-SPECIFIC CLICHÉS (Enhanced with Categories)
// ============================================================================

/**
 * STANFORD CLICHÉS - Expanded from 7 to 25 patterns
 *
 * Categories:
 * - direct_term: Using Stanford's own terminology back at them
 * - generic_flattery: Empty praise that says nothing
 * - surface_research: Shows you googled but didn't understand
 * - predictable_connection: Obvious links everyone makes
 * - essay_formula: Predictable narrative structures
 * - value_signaling: Claiming values without demonstrating
 */
const STANFORD_CLICHES: CollegeCliche[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECT TERM USAGE (Using Stanford's own words back at them)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /intellectual vitality|vitality/i,
    description: 'Directly using Stanford\'s own term',
    why_cliche: 'Admissions officers see this phrase 1000+ times. It signals you read the website but don\'t understand the concept.',
    better_approach: 'SHOW intellectual vitality through specific examples of curiosity, not by naming it.',
    severity: 'critical',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /distinctively stanford|stanford experience/i,
    description: 'Using Stanford\'s marketing language',
    why_cliche: 'Copying admissions brochure language shows no original thought.',
    better_approach: 'Describe what specifically draws you without using their exact phrases.',
    severity: 'critical',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /purposeful life|lives of purpose/i,
    description: 'Stanford mission statement echo',
    why_cliche: 'Quoting mission statements shows surface-level research.',
    better_approach: 'Show what purpose means to YOU through specific examples.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // GENERIC FLATTERY (Empty praise that says nothing)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /Stanford is my dream school/i,
    description: 'Dream school declaration',
    why_cliche: 'Empty flattery that says nothing about fit or contribution.',
    better_approach: 'Show specific alignment between your interests and Stanford\'s unique offerings.',
    severity: 'critical',
    affects_values: ['authentic_voice', 'distinctive_contribution'],
  },
  {
    pattern: /always wanted to (?:go to|attend) Stanford/i,
    description: '"Always wanted" declaration',
    why_cliche: 'Long-term desire without explanation isn\'t compelling.',
    better_approach: 'Show what specifically about Stanford matches your intellectual interests.',
    severity: 'critical',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /(?:best|top|premier) university|world-?class/i,
    description: 'Prestige acknowledgment',
    why_cliche: 'Stanford knows its ranking. Flattery adds nothing.',
    better_approach: 'Focus on FIT, not prestige. What specifically aligns?',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /unique (?:community|environment|culture)/i,
    description: 'Generic uniqueness claim',
    why_cliche: 'Every applicant calls it "unique" - what specifically?',
    better_approach: 'Name the specific aspect of community and how you\'d contribute.',
    severity: 'minor',
    affects_values: ['distinctive_contribution'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SURFACE RESEARCH (Shows you googled but didn't understand)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /d\.school|design school|design thinking/i,
    description: 'd.school reference without depth',
    why_cliche: 'Everyone mentions d.school. What specifically about design thinking?',
    better_approach: 'Name a specific methodology, project, or how you\'ve already applied design thinking.',
    severity: 'moderate',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /human-?centered design/i,
    description: 'Human-centered design buzzword',
    why_cliche: 'Generic phrase without specific application.',
    better_approach: 'Show how you\'ve applied this approach to a specific problem.',
    severity: 'moderate',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /(?:professor|dr\.?) [\w]+ (?:research|work|lab)/i,
    description: 'Professor name-drop without depth',
    why_cliche: 'Mentioning a professor isn\'t impressive without engaging their work.',
    better_approach: 'Reference a SPECIFIC paper, finding, or question their work raises for you.',
    severity: 'minor',
    affects_values: ['intellectual_vitality'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PREDICTABLE CONNECTIONS (Obvious links everyone makes)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /silicon valley|startup culture|entrepreneurial spirit/i,
    description: 'Silicon Valley/startup culture reference',
    why_cliche: 'Generic tech industry connection that thousands of applicants make.',
    better_approach: 'Name specific Stanford resources, labs, or professors. Show research depth.',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /innovation|innovative|innovate/i,
    description: 'Innovation buzzword',
    why_cliche: 'Empty buzzword without specific examples of what you\'ve innovated.',
    better_approach: 'Show something you actually created, improved, or rethought.',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /tech (?:hub|center|industry)|technology capital/i,
    description: 'Tech hub reference',
    why_cliche: 'Generic geographic reference everyone makes.',
    better_approach: 'Name specific companies, research, or people you want to engage with.',
    severity: 'minor',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /interdisciplinary|cross-?disciplinary|bridge.*fields/i,
    description: 'Interdisciplinary buzzword',
    why_cliche: 'Overused term without specific examples. Every school claims to be interdisciplinary.',
    better_approach: 'Name the SPECIFIC fields you want to connect and HOW you\'ll do it.',
    severity: 'moderate',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /collaborate with|work alongside|learn from/i,
    description: 'Generic collaboration claim',
    why_cliche: 'Everyone wants to collaborate. What specifically would you bring?',
    better_approach: 'Show what unique perspective you\'d contribute to collaboration.',
    severity: 'minor',
    affects_values: ['distinctive_contribution'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // ESSAY FORMULA (Predictable narrative structures)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /ever since I was (?:a child|young|little)/i,
    description: '"Ever since I was young" origin story',
    why_cliche: 'Stanford explicitly warns against childhood fascination narratives without current depth.',
    better_approach: 'Start with a RECENT moment of intellectual engagement. Show current depth.',
    severity: 'critical',
    affects_values: ['intellectual_vitality', 'authentic_voice'],
  },
  {
    pattern: /for as long as I can remember/i,
    description: '"For as long as I can remember" opening',
    why_cliche: 'Cliché opening that signals a generic essay.',
    better_approach: 'Start with a specific, recent moment that shows who you are NOW.',
    severity: 'critical',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /change the world|make a difference|impact society/i,
    description: 'Vague impact statements',
    why_cliche: 'Generic ambition without specific mechanism. Everyone wants to "change the world."',
    better_approach: 'Name a SPECIFIC problem and your SPECIFIC approach, grounded in evidence.',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /(?:my|the) journey/i,
    description: '"Journey" metaphor',
    why_cliche: 'Overused metaphor that signals AI-generated or formulaic writing.',
    better_approach: 'Describe specific moments, not vague journeys.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUE SIGNALING (Claiming values without demonstrating)
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /passion for (?:learning|knowledge|understanding)/i,
    description: 'Generic passion for learning',
    why_cliche: 'Claims passion without demonstrating it. Performative authenticity.',
    better_approach: 'Show the specific rabbit hole, the question you couldn\'t stop thinking about.',
    severity: 'critical',
    affects_values: ['intellectual_vitality', 'authentic_voice'],
  },
  {
    pattern: /I(?:'m| am) (?:passionate|curious|fascinated) (?:about|by)/i,
    description: 'Passion/curiosity claim',
    why_cliche: 'Telling instead of showing. Anyone can claim to be curious.',
    better_approach: 'Show curiosity through specific actions - what did you DO because of this interest?',
    severity: 'moderate',
    affects_values: ['intellectual_vitality', 'authentic_voice'],
  },
  {
    pattern: /love (?:to learn|learning|knowledge)/i,
    description: 'Love of learning claim',
    why_cliche: 'Generic claim every applicant makes.',
    better_approach: 'Show what you learned on your own, outside requirements.',
    severity: 'moderate',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /thirst for knowledge|hunger to learn/i,
    description: 'Melodramatic learning metaphor',
    why_cliche: 'Over-the-top language that sounds performative.',
    better_approach: 'Show specific learning with concrete details, not dramatic language.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /I question everything|always asking why/i,
    description: 'Questioning claim',
    why_cliche: 'Claiming to question without showing specific questions.',
    better_approach: 'Share an actual question you\'re wrestling with right now.',
    severity: 'moderate',
    affects_values: ['intellectual_vitality'],
  },
];

/**
 * MIT CLICHÉS - Expanded from 3 to 15 patterns
 */
const MIT_CLICHES: CollegeCliche[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECT TERM USAGE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /IHTFP/i,
    description: 'MIT in-joke without context',
    why_cliche: 'Surface-level research that shows you know abbreviations but not culture.',
    better_approach: 'Show genuine understanding of MIT\'s collaborative, maker culture.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /mens et manus|mind and hand/i,
    description: 'Directly quoting MIT motto',
    why_cliche: 'Shows you read the website. Every applicant knows the motto.',
    better_approach: 'DEMONSTRATE mind AND hand working together through your own projects.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /institute of technology/i,
    description: 'Formal MIT reference',
    why_cliche: 'Overly formal, shows distance from actual MIT culture.',
    better_approach: 'Just use "MIT" - the culture is informal.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // SURFACE RESEARCH
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /hack(?:ing|er|s)|pranks?/i,
    description: 'Hacking culture reference',
    why_cliche: 'Everyone mentions MIT hacks. It\'s become a cliché itself.',
    better_approach: 'Show YOUR creative problem-solving in action, not MIT\'s history.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /infinite corridor/i,
    description: 'Infinite Corridor reference',
    why_cliche: 'Tourist-level knowledge that every applicant mentions.',
    better_approach: 'Reference specific labs, UROPs, or research that interests you.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /brass rat/i,
    description: 'Class ring reference',
    why_cliche: 'Surface tradition reference without deeper connection.',
    better_approach: 'Talk about the culture and what you\'d contribute, not symbols.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /p-?sets?|problem sets/i,
    description: 'P-set reference as defining feature',
    why_cliche: 'Everyone knows MIT is hard. What matters is how you approach challenges.',
    better_approach: 'Show how you\'ve already tackled difficult problems collaboratively.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUE SIGNALING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /I(?:'m| am) a maker|I love (?:to )?build/i,
    description: 'Maker identity claim',
    why_cliche: 'Claiming to be a maker without evidence.',
    better_approach: 'SHOW what you\'ve built - version numbers, failures, iterations.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /love solving problems|problem-?solver/i,
    description: 'Problem-solver claim',
    why_cliche: 'Generic claim. Everyone applying to MIT likes solving problems.',
    better_approach: 'Describe a specific problem you couldn\'t let go of.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /hands-?on (?:person|learner|approach)/i,
    description: 'Hands-on claim',
    why_cliche: 'Empty claim without demonstrating it.',
    better_approach: 'Show grease under your fingernails - what did you actually build?',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /I want to build|dream of building/i,
    description: 'Future building aspirations',
    why_cliche: 'Focuses on future intent, not past evidence.',
    better_approach: 'Show what you\'ve ALREADY built. MIT wants builders, not dreamers.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PREDICTABLE CONNECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /cutting-?edge|bleeding-?edge|forefront/i,
    description: 'Cutting-edge buzzword',
    why_cliche: 'Empty tech buzzword without specific research interest.',
    better_approach: 'Name the specific research area or lab you want to engage with.',
    severity: 'minor',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /MIT Media Lab/i,
    description: 'Media Lab name-drop',
    why_cliche: 'Everyone mentions Media Lab. What specifically interests you?',
    better_approach: 'Reference a specific project, researcher, or question from their work.',
    severity: 'minor',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /world-?changing|revolutionize/i,
    description: 'World-changing ambitions',
    why_cliche: 'Generic ambitious language without specifics.',
    better_approach: 'MIT wants evidence of building, not grand claims about impact.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
];

/**
 * HARVARD CLICHÉS - Expanded from 2 to 15 patterns
 */
const HARVARD_CLICHES: CollegeCliche[] = [
  // ═══════════════════════════════════════════════════════════════════════════
  // DIRECT TERM USAGE
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /veritas/i,
    description: 'Directly referencing Harvard motto',
    why_cliche: 'Generic motto reference without demonstrating commitment to truth.',
    better_approach: 'Show a specific moment where you pursued truth despite difficulty.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /crimson/i,
    description: 'Crimson reference',
    why_cliche: 'Surface-level brand reference.',
    better_approach: 'Focus on substance, not symbols.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PRESTIGE REFERENCES
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /oldest|first|most prestigious/i,
    description: 'Prestige references',
    why_cliche: 'Harvard knows its reputation. Citing prestige adds nothing.',
    better_approach: 'Focus on what YOU will bring to Harvard, not what Harvard gives you.',
    severity: 'critical',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /(?:best|top|elite|premier) (?:university|school|institution)/i,
    description: 'Elite institution language',
    why_cliche: 'Flattery that every applicant uses.',
    better_approach: 'Show specific fit, not generic admiration for prestige.',
    severity: 'critical',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /famous alumni|illustrious graduates/i,
    description: 'Alumni name-dropping',
    why_cliche: 'Harvard doesn\'t need you to list their graduates.',
    better_approach: 'Talk about what YOU will contribute.',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /world-?renowned|internationally recognized/i,
    description: 'Prestige acknowledgment',
    why_cliche: 'Generic praise that adds nothing.',
    better_approach: 'Focus on specific programs, not reputation.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // VALUE SIGNALING
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /want to lead|aspire to lead|future leader/i,
    description: 'Leadership aspiration claim',
    why_cliche: 'Everyone claims to want to lead. Show leadership evidence.',
    better_approach: 'Describe specific leadership moments with impact.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /make (?:an )?impact|change (?:the )?world/i,
    description: 'Impact claim',
    why_cliche: 'Generic ambition without specific mechanism.',
    better_approach: 'Show impact you\'ve ALREADY had, however small.',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /give back|serve others|help (?:my )?community/i,
    description: 'Service claim',
    why_cliche: 'Vague service language without specifics.',
    better_approach: 'Describe specific service with tangible outcomes.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },
  {
    pattern: /global citizen|world citizen/i,
    description: 'Global citizen claim',
    why_cliche: 'Buzzword without substance.',
    better_approach: 'Show specific cross-cultural engagement or global awareness.',
    severity: 'moderate',
    affects_values: ['authentic_voice'],
  },

  // ═══════════════════════════════════════════════════════════════════════════
  // PREDICTABLE CONNECTIONS
  // ═══════════════════════════════════════════════════════════════════════════
  {
    pattern: /harvard business|hbs/i,
    description: 'HBS name-drop',
    why_cliche: 'Generic professional school reference.',
    better_approach: 'Show specific interest in case method, specific courses, or faculty.',
    severity: 'minor',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /kennedy school|government/i,
    description: 'Kennedy School reference without depth',
    why_cliche: 'Surface reference to policy interest.',
    better_approach: 'Describe specific policy area and your approach.',
    severity: 'minor',
    affects_values: ['intellectual_vitality'],
  },
  {
    pattern: /diverse perspectives|diversity of thought/i,
    description: 'Diversity buzzword',
    why_cliche: 'Every school values diversity. What specific perspective do YOU bring?',
    better_approach: 'Name your specific perspective and how it differs.',
    severity: 'moderate',
    affects_values: ['distinctive_contribution'],
  },
  {
    pattern: /well-?rounded|holistic/i,
    description: 'Well-rounded claim',
    why_cliche: 'Generic self-description that adds nothing.',
    better_approach: 'Show depth in specific areas rather than breadth claims.',
    severity: 'minor',
    affects_values: ['authentic_voice'],
  },
];

const COLLEGE_CLICHE_MAP: Record<string, CollegeCliche[]> = {
  stanford: STANFORD_CLICHES,
  mit: MIT_CLICHES,
  harvard: HARVARD_CLICHES,
};

// ============================================================================
// COLLEGE-SPECIFIC ELITE CRAFT
// ============================================================================

const STANFORD_ELITE_CRAFT: CollegeEliteCraftMarker[] = [
  {
    marker: 'Rabbit Hole Depth',
    what_it_looks_like: 'Shows a specific path of intellectual exploration - from initial question to deeper questions to unexpected connections.',
    why_this_college_values_it: 'Stanford\'s "intellectual vitality" is about the PROCESS of thinking, not just having interests.',
    example: 'Reading about fermentation led me to mycorrhizal networks, then to economic theories of cooperation, and finally to my own experiment on fungal communication in my backyard.',
    anti_example: 'I\'m interested in biology and chemistry.',
  },
  {
    marker: 'Genuine Uncertainty',
    what_it_looks_like: 'Admits what you DON\'T know. Shows questions without neat answers.',
    why_this_college_values_it: 'Dean Shaw emphasizes "questions you can\'t stop thinking about" - implying they\'re still unresolved.',
    example: 'I still don\'t understand why the model breaks at high temperatures. I have three theories, none satisfying.',
    anti_example: 'Through this experience, I learned that perseverance always leads to success.',
  },
  {
    marker: 'Self-Directed Exploration',
    what_it_looks_like: 'Clear evidence of pursuing knowledge OUTSIDE of classes, requirements, or external expectations.',
    why_this_college_values_it: 'Intellectual vitality = "vitality for anything they engage in" - self-direction proves it.',
    example: 'At 2 AM on a Saturday, I was debugging a neural network nobody asked me to build.',
    anti_example: 'In my AP Biology class, I learned about genetics.',
  },
  {
    marker: 'Cross-Domain Connection',
    what_it_looks_like: 'Links between seemingly unrelated fields that reveal how YOUR mind works.',
    why_this_college_values_it: 'Shows the "depth of thought" and intellectual range Stanford values.',
    example: 'The failure mode in my grandmother\'s navigation app reminded me of linguistic drift in dying languages.',
    anti_example: 'I want to combine computer science and biology.',
  },
];

const MIT_ELITE_CRAFT: CollegeEliteCraftMarker[] = [
  {
    marker: 'Build Evidence',
    what_it_looks_like: 'Describes something you MADE - code, hardware, experiment, system. Shows iteration.',
    why_this_college_values_it: 'MIT\'s motto is "Mens et Manus" - mind AND hand. Building proves both.',
    example: 'Version 3 finally worked. Versions 1-2 taught me that heat dissipation trumps elegant code.',
    anti_example: 'I\'m interested in robotics and want to learn to build things.',
  },
  {
    marker: 'Failure as Feature',
    what_it_looks_like: 'Celebrates failures as learning moments. Shows iteration count, specific breakdowns.',
    why_this_college_values_it: 'MIT culture embraces productive failure. "Fail fast" is doctrine.',
    example: 'After 47 failed attempts, I finally understood why the servo kept burning out.',
    anti_example: 'I overcame challenges and succeeded.',
  },
  {
    marker: 'Collaborative Credit',
    what_it_looks_like: 'Names collaborators, acknowledges help, shows team thinking.',
    why_this_college_values_it: 'MIT values collaboration. Solo hero narratives raise red flags.',
    example: 'Sarah fixed the power supply while I debugged the code. Neither of us could have done it alone.',
    anti_example: 'I led the team and made all the key decisions.',
  },
];

const HARVARD_ELITE_CRAFT: CollegeEliteCraftMarker[] = [
  {
    marker: 'Impact Trajectory',
    what_it_looks_like: 'Shows past → present → future arc of growing impact.',
    why_this_college_values_it: 'Harvard seeks future leaders. Trajectory matters more than current position.',
    example: 'What started as tutoring one neighbor became a network of 12 volunteer tutors serving 40 kids.',
    anti_example: 'I founded an organization and it was successful.',
  },
  {
    marker: 'Awareness of Stakes',
    what_it_looks_like: 'Shows understanding of larger context, why problems matter beyond personal interest.',
    why_this_college_values_it: 'Harvard expects global awareness and sense of responsibility.',
    example: 'My grandmother\'s confusion with her pills isn\'t just personal - medication errors kill 7,000 Americans yearly.',
    anti_example: 'I want to help people.',
  },
];

const COLLEGE_ELITE_CRAFT_MAP: Record<string, CollegeEliteCraftMarker[]> = {
  stanford: STANFORD_ELITE_CRAFT,
  mit: MIT_ELITE_CRAFT,
  harvard: HARVARD_ELITE_CRAFT,
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class CollegeOverlayService {
  /**
   * Get comprehensive college context for prompt generation
   */
  getCollegeContextForPrompt(
    college: CollegeResearch,
    essayType: SupplementalType,
    promptId?: string
  ): CollegeContextForPrompt {
    const collegeId = college.collegeId?.toLowerCase() || 'unknown';
    const personality = this.getCollegePersonality(college, collegeId);
    const promptGuidance = this.getPromptGuidance(college, promptId);
    const valuesToDemonstrate = this.getValuesDemonstrationGuide(college, essayType);
    const citationOpportunities = this.getCitationOpportunities(college);
    const clichesToAvoid = this.getCollegeCliches(collegeId, essayType);
    const eliteCraft = this.getEliteCraftRequirements(collegeId);
    const { redFlags, greenFlags } = this.getCollegeFlags(college, essayType);

    return {
      college_name: college.collegeName,
      personality,
      prompt_guidance: promptGuidance,
      values_to_demonstrate: valuesToDemonstrate,
      citation_opportunities: citationOpportunities,
      cliches_to_avoid: clichesToAvoid,
      elite_craft_requirements: eliteCraft,
      red_flags: redFlags,
      green_flags: greenFlags,
    };
  }

  /**
   * Build the college personality profile
   */
  private getCollegePersonality(college: CollegeResearch, collegeId: string): CollegePersonality {
    const basePersonality = COLLEGE_PERSONALITIES[collegeId] || {};
    const values = college.coreValues || [];

    return {
      college_id: collegeId,
      college_name: college.collegeName,
      preferred_tone: basePersonality.preferred_tone || 'intellectual',
      formality_level: basePersonality.formality_level || 'semi-formal',
      risk_tolerance: basePersonality.risk_tolerance || 'moderate',
      signature_qualities: basePersonality.signature_qualities || values.map(v => v.essayImplication).slice(0, 5),
      college_specific_cliches: COLLEGE_CLICHE_MAP[collegeId] || [],
      elite_craft_markers: COLLEGE_ELITE_CRAFT_MAP[collegeId] || [],
      evaluation_philosophy: basePersonality.evaluation_philosophy ||
        `${college.collegeName} values ${values.map(v => v.valueName).join(', ')}.`,
    };
  }

  /**
   * Get prompt-specific guidance
   */
  private getPromptGuidance(college: CollegeResearch, promptId?: string): PromptSpecificGuidance {
    const prompts = college.essayPrompts || [];
    const prompt = promptId
      ? prompts.find(p => p.promptId === promptId)
      : prompts[0];

    if (!prompt) {
      return this.getDefaultPromptGuidance();
    }

    // Extract guidance from prompt rubric
    const excellent = prompt.rubric?.excellent;
    const mustDemonstrate = excellent?.criteria || [];
    const mustAvoid = prompt.rubric?.weak?.criteria?.map(c => `AVOID: ${c}`) || [];

    return {
      prompt_id: prompt.promptId,
      prompt_title: prompt.promptTitle,
      hidden_assessment: prompt.primaryAssessment || 'General quality and fit',
      must_demonstrate: mustDemonstrate,
      must_avoid: mustAvoid,
      recommended_structure: this.getRecommendedStructure(prompt),
      word_allocation: this.getWordAllocation(prompt),
      prompt_red_flags: this.extractPromptRedFlags(college, prompt),
      prompt_green_flags: this.extractPromptGreenFlags(college, prompt),
    };
  }

  /**
   * Get recommended structure for prompt
   */
  private getRecommendedStructure(prompt: CollegeEssayPrompt): PromptSpecificGuidance['recommended_structure'] {
    const typical = prompt.rubric?.excellent?.typicalElements || [];

    return {
      opening: typical[0] || 'Hook with specific moment or question',
      body: typical.slice(1, -1).join('; ') || 'Develop depth through examples and reflection',
      closing: typical[typical.length - 1] || 'End with forward momentum or lingering question',
    };
  }

  /**
   * Get word allocation guidance
   */
  private getWordAllocation(prompt: CollegeEssayPrompt): PromptSpecificGuidance['word_allocation'] {
    const wordLimit = prompt.wordCount?.max || 250;

    // Different allocations based on prompt type
    if (prompt.promptTitle.toLowerCase().includes('intellectual')) {
      return [
        { section: 'Hook/Question', percentage: 15, guidance: 'Open with the specific fascination' },
        { section: 'Exploration', percentage: 50, guidance: 'Show the rabbit hole - how deep you went' },
        { section: 'Insight/Uncertainty', percentage: 25, guidance: 'What you learned or still question' },
        { section: 'Forward Look', percentage: 10, guidance: 'Hint at continued engagement' },
      ];
    }

    if (prompt.promptTitle.toLowerCase().includes('roommate')) {
      return [
        { section: 'Personal Detail', percentage: 30, guidance: 'Specific quirk or habit' },
        { section: 'Why It Matters', percentage: 40, guidance: 'What this reveals about you' },
        { section: 'Community Connection', percentage: 30, guidance: 'How you\'ll engage with others' },
      ];
    }

    // Default allocation
    return [
      { section: 'Opening', percentage: 20, guidance: 'Specific moment or question' },
      { section: 'Development', percentage: 55, guidance: 'Depth with examples' },
      { section: 'Conclusion', percentage: 25, guidance: 'Insight and forward momentum' },
    ];
  }

  /**
   * Get values demonstration guide
   */
  private getValuesDemonstrationGuide(
    college: CollegeResearch,
    essayType: SupplementalType
  ): CollegeContextForPrompt['values_to_demonstrate'] {
    const values = college.coreValues || [];

    return values.slice(0, 4).map((value: CollegeCoreValue) => ({
      value,
      demonstration_guidance: this.getValueDemonstrationForType(value, essayType),
      sample_integration: this.getSampleValueIntegration(value, essayType),
    }));
  }

  /**
   * Get type-specific value demonstration guidance
   */
  private getValueDemonstrationForType(value: CollegeCoreValue, essayType: SupplementalType): string {
    const valueName = value.valueName.toLowerCase();

    // Type-specific templates
    const templates: Record<SupplementalType, (v: string) => string> = {
      why_us: (v) => `Show how a specific ${v}-related resource/program aligns with your interests`,
      why_major: (v) => `Demonstrate ${v} through your intellectual journey in this field`,
      intellectual: (v) => `This is THE essay to show ${v} - go deep, show obsession`,
      community: (v) => `Show how you\'ll contribute to ${v}-focused communities`,
      diversity: (v) => `Connect your unique perspective to ${v}`,
      extracurricular: (v) => `Show ${v} through depth in your activity`,
      challenge: (v) => `Demonstrate ${v} through how you faced adversity`,
      leadership: (v) => `Show ${v} through your leadership approach`,
      creative: (v) => `Express ${v} through your creative process`,
      values: (v) => `Articulate how your values align with ${v}`,
      future_goals: (v) => `Connect your goals to ${v}`,
      additional_info: (v) => `Add context that demonstrates ${v}`,
      short_answer: (v) => `Pack ${v} into concise response`,
      optional: (v) => `Use this to show ${v} if missing elsewhere`,
    };

    return templates[essayType](valueName);
  }

  /**
   * Get sample value integration
   */
  private getSampleValueIntegration(value: CollegeCoreValue, essayType: SupplementalType): string {
    const is = value.is || [];
    const evidence = value.evidence?.[0]?.quote || '';

    if (essayType === 'intellectual' && value.valueName.toLowerCase().includes('intellectual')) {
      return `Show "${is[0] || 'energy and depth of thought'}" by describing your specific rabbit hole`;
    }

    return `Demonstrate "${is[0] || value.valueName}" through specific examples`;
  }

  /**
   * Get citation opportunities
   */
  private getCitationOpportunities(college: CollegeResearch): CollegeContextForPrompt['citation_opportunities'] {
    const quotes = college.keyQuotes || [];

    return quotes.slice(0, 5).map((quote: CollegeKeyQuote) => ({
      quote,
      natural_trigger: this.getNaturalTrigger(quote),
      integration_template: this.getIntegrationTemplate(quote, college.collegeName),
    }));
  }

  /**
   * Get natural trigger for quote
   */
  private getNaturalTrigger(quote: CollegeKeyQuote): string {
    const useCases = quote.useCases || [];
    if (useCases.length > 0) {
      return `When ${useCases[0].issue?.toLowerCase() || 'discussing related topics'}`;
    }
    return `When discussing ${quote.context?.toLowerCase() || 'relevant topics'}`;
  }

  /**
   * Get integration template for quote
   */
  private getIntegrationTemplate(quote: CollegeKeyQuote, collegeName: string): string {
    const source = quote.source?.name || 'Unknown';
    const shortQuote = quote.quote.length > 60 ? quote.quote.substring(0, 57) + '...' : quote.quote;

    return `As ${collegeName}'s ${source} emphasizes, "${shortQuote}"`;
  }

  /**
   * Get college-specific clichés
   */
  private getCollegeCliches(collegeId: string, essayType: SupplementalType): CollegeCliche[] {
    const baseCliches = COLLEGE_CLICHE_MAP[collegeId] || [];

    // Add type-specific clichés
    const typeCliches = this.getTypeClichesForCollege(collegeId, essayType);

    return [...baseCliches, ...typeCliches];
  }

  /**
   * Get type-specific clichés for college
   */
  private getTypeClichesForCollege(collegeId: string, essayType: SupplementalType): CollegeCliche[] {
    // Add more type-specific clichés based on college and essay type
    if (collegeId === 'stanford' && essayType === 'intellectual') {
      return [
        {
          pattern: /I was always curious|I've always been fascinated/i,
          description: '"Always curious" opening',
          why_cliche: 'Stanford\'s intellectual vitality essay needs SPECIFIC curiosity, not generic claims.',
          better_approach: 'Open with the specific question or moment that sparked exploration.',
          severity: 'critical',
          affects_values: ['intellectual_vitality'],
        },
      ];
    }

    return [];
  }

  /**
   * Get elite craft requirements for college
   */
  private getEliteCraftRequirements(collegeId: string): CollegeEliteCraftMarker[] {
    return COLLEGE_ELITE_CRAFT_MAP[collegeId] || [];
  }

  /**
   * Get college flags
   */
  private getCollegeFlags(college: CollegeResearch, essayType: SupplementalType): { redFlags: string[]; greenFlags: string[] } {
    const redFlags: string[] = [];
    const greenFlags: string[] = [];

    // Add from college data
    const collegeRedFlags = college.redFlags || [];
    const collegeGreenFlags = college.greenFlags || [];

    for (const flag of collegeRedFlags.slice(0, 5)) {
      redFlags.push(`${flag.flagId}: ${flag.description}`);
    }

    for (const flag of collegeGreenFlags.slice(0, 5)) {
      greenFlags.push(`${flag.flagId}: ${flag.description}`);
    }

    return { redFlags, greenFlags };
  }

  /**
   * Extract prompt-specific red flags
   */
  private extractPromptRedFlags(college: CollegeResearch, prompt: CollegeEssayPrompt): string[] {
    const weakCriteria = prompt.rubric?.weak?.criteria || [];
    return weakCriteria.slice(0, 5);
  }

  /**
   * Extract prompt-specific green flags
   */
  private extractPromptGreenFlags(college: CollegeResearch, prompt: CollegeEssayPrompt): string[] {
    const excellentCriteria = prompt.rubric?.excellent?.criteria || [];
    return excellentCriteria.slice(0, 5);
  }

  /**
   * Get default prompt guidance
   */
  private getDefaultPromptGuidance(): PromptSpecificGuidance {
    return {
      prompt_id: 'default',
      prompt_title: 'General Supplemental',
      hidden_assessment: 'Fit and authentic voice',
      must_demonstrate: ['Authentic voice', 'Specific examples', 'Clear fit'],
      must_avoid: ['Generic statements', 'Resume recitation', 'Buzzwords'],
      recommended_structure: {
        opening: 'Specific hook',
        body: 'Development with examples',
        closing: 'Forward-looking insight',
      },
      word_allocation: [
        { section: 'Opening', percentage: 20, guidance: 'Hook' },
        { section: 'Body', percentage: 60, guidance: 'Develop' },
        { section: 'Closing', percentage: 20, guidance: 'Insight' },
      ],
      prompt_red_flags: [],
      prompt_green_flags: [],
    };
  }

  /**
   * Check text for college-specific clichés
   */
  detectCollegeCliches(text: string, collegeId: string): {
    found: CollegeCliche[];
    score_impact: 'critical' | 'moderate' | 'minor' | 'none';
    coaching: string;
  } {
    const cliches = COLLEGE_CLICHE_MAP[collegeId] || [];
    const found: CollegeCliche[] = [];

    for (const cliche of cliches) {
      if (cliche.pattern.test(text)) {
        found.push(cliche);
      }
    }

    if (found.length === 0) {
      return {
        found: [],
        score_impact: 'none',
        coaching: '',
      };
    }

    const hasCritical = found.some(c => c.severity === 'critical');
    const hasModerate = found.some(c => c.severity === 'moderate');

    return {
      found,
      score_impact: hasCritical ? 'critical' : hasModerate ? 'moderate' : 'minor',
      coaching: `Your essay contains ${found.length} ${collegeId.charAt(0).toUpperCase() + collegeId.slice(1)}-specific clichés: ${found.map(c => c.description).join(', ')}. ${found[0].better_approach}`,
    };
  }

  /**
   * Score how well text demonstrates college values
   */
  scoreValueAlignment(
    text: string,
    college: CollegeResearch
  ): {
    overall_alignment: number; // 0-100
    value_scores: { value: string; score: number; evidence: string }[];
    strongest_value: string;
    weakest_value: string;
    coaching: string;
  } {
    const values = college.coreValues || [];
    const valueScores: { value: string; score: number; evidence: string }[] = [];

    for (const value of values) {
      const score = this.scoreValuePresence(text, value);
      valueScores.push({
        value: value.valueName,
        score,
        evidence: score > 60 ? 'Value demonstrated' : score > 30 ? 'Value partially present' : 'Value not evident',
      });
    }

    // Weighted average based on value weights
    const totalWeight = values.reduce((sum: number, v: CollegeCoreValue) => sum + (v.weight || 25), 0);
    const overall = valueScores.reduce((sum, vs, i) => {
      const weight = values[i]?.weight || 25;
      return sum + (vs.score * weight);
    }, 0) / totalWeight;

    const sorted = [...valueScores].sort((a, b) => b.score - a.score);
    const strongest = sorted[0]?.value || 'Unknown';
    const weakest = sorted[sorted.length - 1]?.value || 'Unknown';

    return {
      overall_alignment: Math.round(overall),
      value_scores: valueScores,
      strongest_value: strongest,
      weakest_value: weakest,
      coaching: overall < 50
        ? `Your essay doesn't yet demonstrate ${college.collegeName}'s core values strongly. Focus on showing "${weakest}" through specific examples.`
        : overall < 75
          ? `Good progress on values alignment. Consider strengthening "${weakest}" demonstration.`
          : `Strong values alignment. Your essay effectively demonstrates ${college.collegeName}'s priorities.`,
    };
  }

  /**
   * Score how well text demonstrates a specific value
   */
  private scoreValuePresence(text: string, value: CollegeCoreValue): number {
    let score = 50; // Base score

    // Check for "is" markers (positive)
    const is = value.is || [];
    for (const marker of is) {
      const keywords = marker.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
          score += 10;
        }
      }
    }

    // Check for "isNot" markers (negative)
    const isNot = value.isNot || [];
    for (const antiMarker of isNot) {
      const keywords = antiMarker.toLowerCase().split(/\s+/).filter(w => w.length > 4);
      for (const keyword of keywords) {
        if (text.toLowerCase().includes(keyword)) {
          score -= 10;
        }
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Format comprehensive college context for prompt injection
   */
  formatCollegeContextForPrompt(context: CollegeContextForPrompt): string {
    const { personality, prompt_guidance, values_to_demonstrate, citation_opportunities, cliches_to_avoid, elite_craft_requirements, red_flags, green_flags } = context;

    return `
═══════════════════════════════════════════════════════════
COLLEGE: ${context.college_name}
═══════════════════════════════════════════════════════════

COLLEGE PERSONALITY:
- Tone: ${personality.preferred_tone}
- Formality: ${personality.formality_level}
- Risk Tolerance: ${personality.risk_tolerance}
- Evaluation Philosophy: ${personality.evaluation_philosophy}

SIGNATURE QUALITIES (What makes an essay "sound like" ${context.college_name}):
${personality.signature_qualities.map(q => `• ${q}`).join('\n')}

───────────────────────────────────────────────────────────
PROMPT-SPECIFIC GUIDANCE: ${prompt_guidance.prompt_title}
───────────────────────────────────────────────────────────

HIDDEN ASSESSMENT: ${prompt_guidance.hidden_assessment}

MUST DEMONSTRATE:
${prompt_guidance.must_demonstrate.map(d => `✓ ${d}`).join('\n')}

MUST AVOID:
${prompt_guidance.must_avoid.map(a => `✗ ${a}`).join('\n')}

RECOMMENDED STRUCTURE:
- Opening: ${prompt_guidance.recommended_structure.opening}
- Body: ${prompt_guidance.recommended_structure.body}
- Closing: ${prompt_guidance.recommended_structure.closing}

WORD ALLOCATION:
${prompt_guidance.word_allocation.map(w => `• ${w.section} (${w.percentage}%): ${w.guidance}`).join('\n')}

───────────────────────────────────────────────────────────
VALUES TO DEMONSTRATE
───────────────────────────────────────────────────────────

${values_to_demonstrate.map((v, i) => `
${i + 1}. ${v.value.valueName} (Weight: ${v.value.weight}%)
   Definition: ${v.value.definition}
   How to demonstrate: ${v.demonstration_guidance}
   What it IS: ${v.value.is?.slice(0, 3).join('; ') || 'N/A'}
   What it's NOT: ${v.value.isNot?.slice(0, 2).join('; ') || 'N/A'}
`).join('')}

───────────────────────────────────────────────────────────
⚠️ ${context.college_name.toUpperCase()}-SPECIFIC CLICHÉS (MUST AVOID)
───────────────────────────────────────────────────────────

${cliches_to_avoid.map(c => `
✗ ${c.description} [${c.severity.toUpperCase()}]
  Why it's cliché: ${c.why_cliche}
  Better approach: ${c.better_approach}
`).join('')}

───────────────────────────────────────────────────────────
ELITE CRAFT MARKERS (What distinguishes top ${context.college_name} essays)
───────────────────────────────────────────────────────────

${elite_craft_requirements.map(m => `
★ ${m.marker}
  What it looks like: ${m.what_it_looks_like}
  Why ${context.college_name} values it: ${m.why_this_college_values_it}
  Example: "${m.example}"
  Anti-example: "${m.anti_example}"
`).join('')}

───────────────────────────────────────────────────────────
CITATION OPPORTUNITIES
───────────────────────────────────────────────────────────

${citation_opportunities.map(c => `
• "${c.quote.quote.substring(0, 100)}..."
  - ${c.quote.source?.name || 'Unknown'}
  Trigger: ${c.natural_trigger}
  Integration: ${c.integration_template}
`).join('')}

───────────────────────────────────────────────────────────
RED FLAGS (Avoid at all costs)
${red_flags.map(f => `✗ ${f}`).join('\n')}

GREEN FLAGS (Strong signals)
${green_flags.map(f => `✓ ${f}`).join('\n')}
`;
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const collegeOverlayService = new CollegeOverlayService();
