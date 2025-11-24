/**
 * Rationale Standards - Teaching Protocol (Phase 14)
 *
 * This module defines what makes a "world-class" rationale.
 * A great rationale is:
 * - Educational (teaches a principle)
 * - Uplifting (makes the student feel taught, not corrected)
 * - Transferable (applies to other writing situations)
 * - Specific (grounded in the actual text)
 *
 * Anti-patterns:
 * - "I changed X to Y" (just describes the edit)
 * - "This is more specific" (obvious, not educational)
 * - "Better word choice" (vague, not actionable)
 */

// ============================================================================
// RATIONALE EXAMPLES (GOOD VS BAD)
// ============================================================================

export interface RationaleExample {
  scenario: string;
  originalText: string;
  fixedText: string;

  badRationale: string;
  badReason: string;

  goodRationale: string;
  goodReason: string;
}

export const RATIONALE_EXAMPLES: RationaleExample[] = [
  {
    scenario: 'Abstract emotion → Sensory detail',
    originalText: 'I was nervous before the speech.',
    fixedText: 'My hands shook so hard the index cards rattled against the microphone.',

    badRationale: 'Changed "was nervous" to "hands shook" and "index cards rattled" to be more specific.',
    badReason: 'Just describes the edit. Doesn\'t explain WHY or teach the principle.',

    goodRationale: 'By anchoring the abstract emotion "nervous" to physical manifestations (shaking hands, rattling cards), we create a sensory experience readers can feel in their own bodies. This is the essence of "Show Don\'t Tell"—not stating emotions, but making readers experience them through concrete details.',
    goodReason: 'Explains the PRINCIPLE (Show Don\'t Tell), teaches WHY it works (sensory experience), and is transferable to other situations.'
  },

  {
    scenario: 'Generic effort → Specific action',
    originalText: 'The team worked hard all summer.',
    fixedText: 'We spent July pushing sleds until the grass stains on our knees turned permanent.',

    badRationale: 'Made it more specific by adding "pushing sleds" and "grass stains".',
    badReason: 'States the obvious. Doesn\'t teach anything.',

    goodRationale: 'Generic summaries like "worked hard" force readers to imagine their own version of effort. By choosing ONE specific, repeatable action (pushing sleds) and ONE piece of physical evidence (permanent grass stains), we make the reader see exactly what "hard work" looked like for YOU. Specificity creates believability.',
    goodReason: 'Explains WHY specificity matters (believability), teaches the trade-off (one detail vs. many vague ones), and uses "you" to make it personal.'
  },

  {
    scenario: 'Telling transformation → Showing trigger',
    originalText: 'I realized I needed to change my leadership style.',
    fixedText: 'Watching the freshman flinch when I shouted, I realized my voice was causing fear, not focus.',

    badRationale: 'Added the detail about the freshman flinching to show the realization instead of just stating it.',
    badReason: 'Describes WHAT changed, not WHY it\'s better.',

    goodRationale: 'Realizations become powerful when we show the MOMENT they happened, not just the conclusion. By revealing the trigger (freshman flinching), we let readers experience the same "aha" moment you did. This creates empathy—readers discover the insight alongside you, rather than being told about it after the fact.',
    goodReason: 'Explains the psychological effect (reader discovery), uses emotional language (empathy, "aha"), and positions the student as a guide.'
  },

  {
    scenario: 'Cliché metaphor → Fresh comparison',
    originalText: 'Coding is like solving a puzzle.',
    fixedText: 'Coding taught me that failure isn\'t an error message; it\'s the first step of iteration.',

    badRationale: 'Replaced the cliché puzzle metaphor with a more original idea about failure and iteration.',
    badReason: 'Says it\'s "more original" but doesn\'t explain why originality matters or what makes this better.',

    goodRationale: 'The "puzzle" metaphor is overused in coding essays because it\'s obvious—both involve solving problems. But fresh metaphors reveal NEW thinking. By redefining "error message" as the START of a process (not a failure), you show intellectual maturity: you\'re not just coding, you\'re philosophizing about what failure means. That\'s memorable.',
    goodReason: 'Explains WHY clichés fail (obvious), teaches what makes metaphors powerful (reveal new thinking), and positions the change as intellectual growth.'
  }
];

// ============================================================================
// RATIONALE TEMPLATES
// ============================================================================

/**
 * Templates for different types of fixes
 * These help generate educational rationales consistently
 */
export const RATIONALE_TEMPLATES = {
  show_dont_tell: {
    structure: '[Principle] + [Why it works] + [Universal insight]',
    examples: [
      'By replacing the abstract [emotion/state] with the physical manifestation ([specific action/detail]), we create a sensory experience that readers can feel in their own bodies. This is the essence of "Show Don\'t Tell"—[explain why showing is more powerful].',

      'When we anchor [abstract concept] to a concrete detail ([specific noun/action]), we transform a generic statement into a unique moment. Readers remember specific images, not vague summaries—this is what makes your story YOURS.'
    ]
  },

  passive_to_active: {
    structure: '[Agency reclaimed] + [Why it matters] + [Impact]',
    examples: [
      'By switching from passive voice ("[was X-ing]") to active voice ("[I X-ed]"), we reclaim your agency. You\'re not receiving action—you\'re creating it. This subtle shift transforms you from an observer into a protagonist, which is essential for college essays.',

      'Passive constructions like "[original]" make you the receiver, not the driver. Active voice ("[revision]") puts you in control. Admissions officers want to see students who ACT, not just experience things happening to them.'
    ]
  },

  abstract_to_concrete: {
    structure: '[The problem with abstractions] + [The power of specificity] + [Believability]',
    examples: [
      'Abstract nouns like "[original concept]" force every reader to imagine their own version. By choosing ONE specific object/action ("[concrete detail]"), you give everyone the SAME image—your unique image. Specificity creates authenticity.',

      'When you say "[abstract statement]", you could be anyone. When you show "[concrete detail]", you\'re unmistakably YOU. College essays are all about differentiation—specific details are how you stand out from thousands of other hardworking, determined students.'
    ]
  },

  cliche_to_original: {
    structure: '[Why clichés fail] + [What makes this fresh] + [Memorable impact]',
    examples: [
      'The "[cliché phrase]" metaphor appears in countless essays because it\'s the FIRST thing everyone thinks of. But "[original phrase]" reveals NEW thinking—it shows you\'ve moved past the obvious into original insight. Admissions officers remember what\'s unexpected.',

      'Clichés like "[original]" are mental shortcuts that stop readers from thinking. Your revision ("[new version]") forces them to pause and process—that pause is where memorability lives. You want admissions officers to slow down and think, not skim past.'
    ]
  },

  narrative_tension: {
    structure: '[Conflict revealed] + [Why tension matters] + [Engagement]',
    examples: [
      'By showing the specific consequence ("[concrete risk]"), we raise the stakes from abstract to tangible. Readers don\'t care about vague "importance"—they care when they can picture exactly what\'s at risk. Stakes create investment.',

      'The original lacked tension because nothing felt at risk. By revealing "[specific vulnerability/consequence]", you create a moment where readers lean in. We read stories to see how people handle pressure—tension is what keeps us reading.'
    ]
  }
};

// ============================================================================
// RATIONALE QUALITY VALIDATOR (LLM-BASED)
// ============================================================================

/**
 * System prompt for validating rationale quality
 * This is used by the LLM validation system
 */
export const RATIONALE_VALIDATION_PROMPT = `You are evaluating the QUALITY of a rationale that explains an essay edit.

**A WORLD-CLASS rationale has these characteristics:**

1. **Educational** - Teaches a transferable writing principle
2. **Specific** - References the actual text being changed
3. **Empowering** - Makes the writer feel taught, not corrected
4. **Explanatory** - Explains WHY the change works, not just WHAT changed
5. **Memorable** - Uses vivid language or analogies to make the lesson stick

**ANTI-PATTERNS (these make rationales BAD):**
- "I changed X to Y" (just describes the edit)
- "This is more specific" (obvious, not educational)
- "Better word choice" (vague)
- Clinical, robotic tone (not uplifting)
- No explanation of WHY it matters

**Your task:**
Evaluate the rationale below. Give it a score 0-10 and explain if it fails any quality standards.

**Return JSON:**
{
  "score": number (0-10),
  "isEducational": boolean,
  "isEmpowering": boolean,
  "isSpecific": boolean,
  "failureReasons": ["reason1", "reason2"],
  "suggestions": ["how to improve"]
}`;

// ============================================================================
// TEACHING PROTOCOL (Enhanced for Context Assembler)
// ============================================================================

/**
 * Comprehensive teaching protocol for inclusion in the Context Document
 * This replaces the 3-line version currently in contextAssembler.ts
 */
export const COMPREHENSIVE_TEACHING_PROTOCOL = `
**TEACHING PROTOCOL - RATIONALE STANDARDS (MANDATORY):**

You are a MENTOR, not just an editor. Your rationales must transform feedback into learning.

**1. RATIONALE STRUCTURE (Use This Formula):**
   - **Principle:** State the writing principle being applied (e.g., "Show Don't Tell")
   - **Why It Works:** Explain the psychological/narrative effect
   - **Universal Insight:** Connect to transferable craft knowledge

**2. LANGUAGE STANDARDS:**
   - ✅ Use: "By [action], we [effect]..." (collaborative, empowering)
   - ✅ Use: "This is the essence of [principle]..." (educational framing)
   - ✅ Use: "Readers [psychological response]..." (explains impact)
   - ❌ Avoid: "I changed..." (editor-centric)
   - ❌ Avoid: "This is better/more specific" (obvious, not educational)
   - ❌ Avoid: Clinical terminology without explanation

**3. TONE REQUIREMENTS:**
   - Be UPLIFTING, not critical
   - Position the student as a collaborator discovering craft principles
   - Use phrases like "you're showing", "this reveals", "notice how"
   - Make them feel TAUGHT, not corrected

**4. GOOD VS BAD RATIONALE EXAMPLES:**

   **BAD:** "Changed 'was nervous' to 'hands shook' for more detail."
   *Why bad:* Just describes what changed. No teaching. No principle.

   **GOOD:** "By anchoring the abstract emotion 'nervous' to physical manifestation (shaking hands, rattling cards), we create a sensory experience readers can feel in their own bodies. This is the essence of 'Show Don't Tell'—not stating emotions, but making readers experience them through concrete details."
   *Why good:* Explains principle, psychological effect, and is transferable.

**5. REQUIRED LENGTH:**
   - Minimum: 25 words
   - Ideal: 40-60 words
   - Maximum: 80 words (be concise but complete)

**6. VALIDATION:**
   - Every rationale will be checked for educational depth
   - Shallow rationales will trigger a retry
   - Your goal: Make every rationale a mini writing lesson
`;

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Check if a rationale meets basic quality standards (deterministic)
 */
export function validateRationaleBasic(rationale: string): {
  isValid: boolean;
  issues: string[];
} {
  const issues: string[] = [];

  // Check length
  const wordCount = rationale.split(/\s+/).length;
  if (wordCount < 20) {
    issues.push(`Rationale too short (${wordCount} words, need 25+)`);
  }

  // Check for "I changed" anti-pattern
  if (/\b[Ii]\s+changed\b/.test(rationale)) {
    issues.push('Uses "I changed" language (should be collaborative: "By X, we Y")');
  }

  // Check for vague language
  const vaguePatterns = [
    /\bmore specific\b/i,
    /\bbetter word choice\b/i,
    /\bimproved\b/i,
    /\benhanced\b/i
  ];

  for (const pattern of vaguePatterns) {
    if (pattern.test(rationale)) {
      issues.push('Uses vague language without explaining WHY');
      break;
    }
  }

  // Check for educational keywords (should have at least one)
  const educationalKeywords = [
    /\bprinciple\b/i,
    /\bessence\b/i,
    /\breaders?\b/i,
    /\bexperience\b/i,
    /\bpsycholog/i,
    /\bshow don't tell\b/i,
    /\bactive voice\b/i,
    /\bspecificity\b/i
  ];

  const hasEducationalKeyword = educationalKeywords.some(pattern => pattern.test(rationale));
  if (!hasEducationalKeyword) {
    issues.push('Lacks educational framing (no mention of principles or craft concepts)');
  }

  return {
    isValid: issues.length === 0,
    issues
  };
}

/**
 * Generate a template-based rationale
 * This is a fallback for when generation fails
 */
export function generateFallbackRationale(
  originalText: string,
  fixedText: string,
  rubricCategory: string
): string {
  // Simple template based on category
  const templates: Record<string, string> = {
    show_dont_tell_craft: `By transforming the summary "${originalText.substring(0, 30)}..." into a concrete moment, we create a sensory experience that readers can visualize. Specific details make your story unique and memorable—this is the essence of "Show Don't Tell".`,

    opening_power_scene_entry: `Strong openings drop readers directly into a moment, not a summary. By grounding this in specific action and detail, we create immediate engagement. Admissions officers read hundreds of essays—you want them to enter YOUR world instantly.`,

    narrative_arc_stakes_turn: `By revealing the specific consequence or tension, we raise the narrative stakes from abstract to tangible. Readers invest in stories when they can see exactly what's at risk—this creates the forward momentum that keeps them reading.`,

    character_interiority_vulnerability: `By revealing your specific thought or doubt in this moment, you show intellectual honesty. Vulnerability creates connection—admissions officers want to see authentic self-reflection, not perfection.`
  };

  return templates[rubricCategory] || `This revision strengthens the narrative by adding specificity and concrete detail, making your unique experience more vivid and memorable for readers.`;
}
