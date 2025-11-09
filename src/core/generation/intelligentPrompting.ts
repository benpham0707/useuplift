/**
 * Intelligent Dynamic Prompting System
 *
 * Builds holistic prompts that maintain essay coherence while intelligently
 * emphasizing specific gaps identified from analysis.
 *
 * KEY PRINCIPLE: Always full prompts, never surgical edits.
 * But dynamically strengthen weak areas within the holistic context.
 */

import type { GenerationProfile } from './essayGenerator';
import type { NarrativeAngle } from './narrativeAngleGenerator';
import { analyzeAuthenticity } from '../analysis/features/authenticityDetector';
import { analyzeElitePatterns } from '../analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from '../analysis/features/literarySophisticationDetector';

export interface DynamicEmphasis {
  category: 'vulnerability' | 'universal_insight' | 'community_transformation' | 'structural_innovation' | 'none';
  reason: string;
  enhancement: string;
}

/**
 * Analyze essay and determine what to emphasize in next iteration
 */
export function identifyEmphasis(essay: string): DynamicEmphasis {
  const auth = analyzeAuthenticity(essay);
  const elite = analyzeElitePatterns(essay);
  const literary = analyzeLiterarySophistication(essay);

  // Priority 1: Structural Innovation (if < 5/15) - BIGGEST literary gap
  // Only prioritize if it's VERY low (0-4 points), otherwise let other priorities handle it
  if (literary.structuralInnovation.score < 5) {
    const hasDualScene = literary.structuralInnovation.innovations.includes('dual_scene_parallelism');
    const hasNonlinear = literary.structuralInnovation.innovations.includes('nonlinear_time');

    if (!hasDualScene && !hasNonlinear) {
      return {
        category: 'structural_innovation',
        reason: `Structural innovation CRITICAL: ${literary.structuralInnovation.score}/15 (missing 10-15 pts)`,
        enhancement: `
⚠️ CRITICAL FOCUS: ADD STRUCTURAL INNOVATION

CURRENT ISSUE: Essay has NO structural innovation (${literary.structuralInnovation.score}/15)
This is costing you 10-15 points!

EASIEST FIX: Add nonlinear time markers (5 points guaranteed)

IMPORTANT: Use these EXACT phrases (they're what the system detects):
✅ "flashback" or "flashforward" (as one word)
✅ "looking back"
✅ "there was a time"
✅ "years ago" or "years earlier" or "years before"
✅ "before this" or "after that"

SIMPLE EXAMPLES:
- "Flashback to three days before regionals..."
- "Looking back, I can see the exact moment everything changed..."
- "Years before I understood collaboration, there was this decimal point..."
- "Before this breakthrough, our team was siloed..."

Pick ONE phrase, use it naturally in the essay. This scores 5 points!

ALTERNATIVE (8 points - harder): Dual-scene structure
Use section markers: "**Scene One:**" and "**Scene Two:**"
Shows before/after contrast in parallel scenes.`
      };
    }
  }

  // Priority 2: Universal Insight (if scoring < 15/20)
  if (elite.microToMacro.score < 15) {
    return {
      category: 'universal_insight',
      reason: `Universal insight scoring ${elite.microToMacro.score}/20 (need 18+)`,
      enhancement: `
⚠️ CRITICAL: UNIVERSAL INSIGHT TOO NARROW

Your conclusion is too activity-specific (scoring ${elite.microToMacro.score}/20)

REQUIRED: End with a universal truth about HUMAN NATURE/SYSTEMS, not just your activity.

🧪 TEST YOUR INSIGHT:
Ask yourself: "Is this ONLY true about my activity, or true about LIFE?"
❌ If it only applies to your specific activity → NOT universal (10-14 pts)
✅ If it reveals truth about ALL human systems → Universal! (18-20 pts)

EXAMPLES:

Activity-Specific (scores 10/20):
"Robotics taught me collaboration beats individual work"
→ Only applies to robotics/teams. Generic lesson.

Universal (scores 18/20):
"Progress isn't individual genius conducting solo performances—it's building bridges between different forms of brilliance, creating symphonies no single musician could play alone"
→ True for research labs, companies, classrooms, ALL complex systems

Another Universal (18/20):
"Complex systems fail not from technical flaws, but from connection errors—the fear that sharing knowledge means losing power"
→ Applies to science, organizations, society, human nature

🎯 YOUR TASK FOR FINAL 2-3 PARAGRAPHS:

1. PATTERN RECOGNITION: Show you see this same pattern EVERYWHERE
   - "Now I see this pattern in..." [list 3 different contexts]
   - Research labs, classrooms, companies, relationships, etc.

2. REVEAL UNIVERSAL TRUTH about:
   • Human nature (what makes us fail/succeed)
   • How ALL complex systems work
   • Counter-intuitive life principle
   • What creates progress or prevents it

3. END WITH PHILOSOPHY: Make the reader think "This is true about LIFE"
   Not "I learned X" but "The truth is Y"

The final insight should feel like a life principle, not a lesson learned.`
    };
  }

  // Priority 2: Parentheticals for Authentic Voice (LOW RISK)
  // Only activate if authenticity is good but could use personality boost
  if (auth.authenticity_score >= 7.5 && auth.authenticity_score < 8.5) {
    const hasParentheticals = auth.authenticity_markers?.includes('has_parentheticals') || false;

    if (!hasParentheticals) {
      return {
        category: 'parentheticals',
        reason: `Authenticity solid (${auth.authenticity_score.toFixed(1)}/10) but missing parentheticals for personality`,
        enhancement: `
⚠️ ADD PERSONALITY: PARENTHETICAL ASIDES

Your voice is authentic (${auth.authenticity_score.toFixed(1)}/10) but could use more personality!

SIMPLE ADD: 2-3 parenthetical asides to show your thinking

EXAMPLES:

Self-aware observations:
• "(and I mean really terrified)"
• "(which, looking back, was ridiculous)"
• "(spoiler: it wasn't)"
• "(trust me, it gets worse)"

Honest admissions:
• "(I had no idea what I was doing)"
• "(not my finest moment)"
• "(yeah, I know how that sounds)"

Quick clarifications:
• "(the good kind of chaos)"
• "(okay, maybe not perfect)"
• "(at least that's what I told myself)"

🎯 PLACEMENT: Sprinkle 2-3 throughout, especially:
  • After vulnerable moments
  • When describing mistakes
  • In moments of realization

Keep them SHORT (3-7 words). They add personality without disrupting flow.

This is a SMALL addition - don't change anything else, just add 2-3 parentheticals!`
      };
    }
  }

  // Priority 3: Authenticity (if scoring < 7.5/10)
  if (auth.authenticity_score < 7.5) {
    return {
      category: 'vulnerability',
      reason: `Authenticity scoring ${auth.authenticity_score.toFixed(1)}/10 (need 8.5+)`,
      enhancement: `
⚠️ CRITICAL FOCUS: AUTHENTIC GENUINE VOICE

CURRENT ISSUE: Voice not authentic enough (${auth.authenticity_score.toFixed(1)}/10, need 8.5+)

REQUIRED: Make the voice feel REAL and HONEST (not performative or essay-like)

ADD 3-5 AUTHENTICITY MARKERS:

1. PARENTHETICALS for personality:
   - "(and I mean really terrified)"
   - "(which, looking back, was ridiculous)"
   - "(spoiler: it wasn't)"

2. HONEST QUESTIONS:
   - "What was I thinking?"
   - "How did I miss this?"
   - "Why didn't anyone warn me?"

3. SENTENCE FRAGMENTS for emphasis:
   - "Gone." "Perfect." "All of it." "Bingo." "Wrong."

4. SELF-AWARE OBSERVATIONS:
   - "I'd like to say I stayed calm. I didn't."
   - "Here's the thing: I had no idea what I was doing."
   - "Trust me, it wasn't pretty."

5. CONVERSATIONAL ASIDES:
   - "Look, I'm not proud of this, but..."
   - "Here's where it gets interesting:"
   - "Plot twist:"

6. GENUINE VULNERABILITY (show the real messy emotion):
   - NOT: "I was nervous"
   - YES: "My hands literally trembled. My stomach churned. I was terrified."

EXAMPLE OF AUTHENTIC VOICE:
"Three days before regionals? Our robot was dead. (And I mean completely, utterly dead—not a single test passed.) I'd like to say I handled it calmly. I didn't. My hands trembled as I stared at 2,847 lines of code that somehow turned our precision machine into expensive garbage. What was I thinking?"

Your essay needs THIS level of genuine, honest voice—like you're telling a friend what really happened.`
    };
  }

  // Priority 4: Vulnerability (if scoring < 7/10)
  if (elite.vulnerability.score < 7) {
    return {
      category: 'vulnerability',
      reason: `Vulnerability scoring ${elite.vulnerability.score}/10 (need 9+)`,
      enhancement: `
⚠️ CRITICAL FOCUS: AUTHENTIC VULNERABILITY

CURRENT ISSUE: Insufficient emotional depth (${elite.vulnerability.score}/10, need 9+)

REQUIRED: Add 2-3 MORE moments showing genuine struggle/emotion.

MUST INCLUDE:

1. PHYSICAL SYMPTOMS (critical):
   - "My hands literally trembled against cold aluminum"
   - "Stomach churned"
   - "Voice cracked"
   - "Jaw dropped"

2. NAMED EMOTIONS (critical):
   - "I was terrified"
   - "felt dumbstruck"
   - "completely out of place"

3. ADMITS LIMITS (critical):
   - "I had no clue where to start"
   - "This seemed impossible"
   - "didn't know how to..."

WHERE TO ADD: At crisis moment, before breakthrough, when facing the problem

EXAMPLE OF STRONG VULNERABILITY:
"My stomach literally churned as I stared at the broken code, hands trembling against the cold aluminum frame. I was terrified—completely lost in algorithms that looked perfect on paper but kept failing in reality. 'This is hopeless,' I whispered, voice cracking with exhaustion."

Your essay needs THIS level of raw, honest emotion.`
    };
  }

  // Note: Structural Innovation is now handled as Priority 1 when critically low (< 5)
  // This section left intentionally blank

  // No critical gaps - just maintain quality
  return {
    category: 'none',
    reason: 'No critical gaps identified',
    enhancement: ''
  };
}

/**
 * Build intelligent prompt that maintains holistic approach while
 * emphasizing identified gaps
 */
export function buildIntelligentPrompt(
  profile: GenerationProfile,
  techniques: string[],
  previousEssay: string | null,
  iteration: number,
  angle?: NarrativeAngle
): string {
  // Determine emphasis (only if we have previous essay to analyze)
  const emphasis = previousEssay ? identifyEmphasis(previousEssay) : { category: 'none', reason: '', enhancement: '' };

  // Build narrative angle guidance if provided (Session 18 integration)
  const angleGuidance = angle ? `

${'='.repeat(80)}
🎯 NARRATIVE ANGLE (Your Unique Perspective - Session 18 Optimization)
${'='.repeat(80)}

**Central Perspective**: "${angle.title}"
**Opening Hook**: ${angle.hook}
**Throughline**: ${angle.throughline}

**What Makes This Unique**:
- Unusual Connection: ${angle.unusualConnection}
- Philosophical Depth: ${angle.philosophicalDepth}
- Universal Insight: ${angle.universalInsight}

**CRITICAL IMPLEMENTATION REQUIREMENTS**:
1. Use the hook as inspiration for your opening (adapt to your authentic voice)
2. Maintain the throughline perspective THROUGHOUT the essay
3. Connect your specific experience to the universal insight
4. Keep it GROUNDED - philosophy must emerge from concrete moments
5. Target authenticity score 9+ (stay genuine, angle enhances but doesn't replace)

⚠️ **Balance**: This angle ENHANCES your story. Ground philosophical depth in SPECIFIC moments (dialogue, sensory details, vulnerability).

` : '';

  // Special first iteration guidance (ensures strong foundation)
  const firstIterationBoost = iteration === 1 && !previousEssay ? `
${'='.repeat(80)}
⚡ FIRST ITERATION: BUILD STRONG FOUNDATION
${'='.repeat(80)}

THIS IS YOUR FIRST DRAFT. Make it count! A strong first iteration (60-65/100) is easier to refine than a weak one (45-55/100).

🎯 MANDATORY FIRST-DRAFT REQUIREMENTS (to hit 60+/100):

1. **STRUCTURAL INNOVATION** (Add immediately - worth 5-8 points):
   ✅ Start with: "Flashback to three days before [event]..." OR
   ✅ Use section markers: "**Scene One:**" and "**Scene Two:**"
   → This scores 5-8 points automatically if done right

2. **VULNERABILITY** (Critical - worth 10 points):
   ✅ Physical symptoms: "hands trembled", "stomach churned", "voice cracked"
   ✅ Named emotions: "I was terrified", "felt dumbstruck"
   ✅ Admit limits: "I had no clue", "seemed impossible"
   → Include ALL THREE types for full credit

3. **IMPACTFUL DIALOGUE** (Critical - worth 10 points):
   ✅ 2-3 exchanges minimum
   ✅ Must reveal character/relationship, not just info
   ✅ Include subtext (what's NOT said matters)
   → Example: "Can you help?" reveals more than "The servo is broken"

4. **CONCRETE METRICS** (Easy points - worth 5-10 points):
   ✅ Specific numbers: "23-page guide", "18 teams", "2,847 lines of code"
   ✅ Before/after transformation: "5 isolated teams → 17 collaborators"
   → Just add numbers to your existing story

5. **UNIVERSAL INSIGHT** (Hardest but highest value - worth 20 points):
   ✅ Must apply beyond your activity to ALL human systems
   ✅ Test: "Is this true about LIFE or just robotics?"
   ✅ Example: "Complex systems fail from connection errors, not technical flaws"
   → Think bigger than your activity

⚠️ **CRITICAL**: Don't try to be perfect, but DO include ALL 5 requirements above. Each one adds 5-20 points to your score. Missing any one hurts badly.

` : '';

  // Base prompt structure (always comprehensive)
  const basePrompt = `You are an elite college admissions essay coach generating iteration ${iteration}.

${previousEssay ? `PREVIOUS ESSAY ANALYSIS:
${emphasis.reason}

${emphasis.enhancement}

PREVIOUS ESSAY:
"""
${previousEssay}
"""

YOUR TASK: Rewrite the essay maintaining its core story and strengths, but addressing the critical focus above.
` : 'YOUR TASK: Generate a compelling personal narrative essay.'}
${firstIterationBoost}
${angleGuidance}
STUDENT PROFILE:
- Activity: ${profile.activityType} - ${profile.role}
- Duration: ${profile.duration} (${profile.hoursPerWeek} hrs/week)
- Voice: ${profile.studentVoice}
- Target: ${profile.targetTier === 1 ? 'Harvard/Stanford/MIT (need 85+ score)' : 'Top UC (need 75+ score)'}

CONTENT (weave into narrative):
Achievements: ${profile.achievements.join('; ')}
Challenges: ${profile.challenges.join('; ')}
Key Relationships: ${profile.relationships.join('; ')}
Community Impact: ${profile.impact.join('; ')}

${'='.repeat(80)}
CORE REQUIREMENTS (ordered by impact)
${'='.repeat(80)}

PRIORITY 1: ELITE PATTERNS (40% of score - what separates top admits)

   Universal Insight (20 pts - HIGHEST IMPACT):
   - Go BEYOND your specific activity to reveal universal truth
   - Reader should think: "This is true about LIFE, not just robotics"
   - Examples: "We debugged fear itself", "Expertise without translation becomes noise"

   Community Transformation (20 pts - CRITICAL):
   - BEFORE: Describe the problem with specific numbers
   - AFTER: Show the change with specific evidence
   - Example: "Before: 12 isolated specialists. After: 17 collaborators, 23 sessions/month"

   Vulnerability (10 pts - ESSENTIAL):
   - Physical symptoms: "hands trembling", "stomach churned", "voice cracked"
   - Named emotions: "terrified", "dumbstruck", "hopeless"
   - Include 2-3 genuine vulnerability moments

   Dialogue & Impact:
   - One meaningful quote that reveals relationship
   - Specific numbers: "8 programmers", "18 teams", "23 sessions"

PRIORITY 2: LITERARY CRAFT (40% of score)

   Extended Metaphor (20 pts - FOUNDATION):
   - Choose ONE central metaphor, weave through ALL paragraphs
   - Natural, not forced
   - Example: robotics → "orchestra/symphony/conducting"

   Sensory Details (15 pts):
   - Use 3+ senses: "cold aluminum", "keyboards clicking", "acrid smell"

   Sentence Rhythm (15 pts):
   - Mix lengths: Very short (1-4 words), short (5-8), long (25+)
   - Examples: "Gone." "Perfect." "My hands trembled."

PRIORITY 3: AUTHENTIC VOICE (20% of score)

   Natural ${profile.studentVoice} Voice:
   - Write like you'd actually think/speak
   - Avoid essay clichés: "shaped who I am", "taught me", "journey"

${'='.repeat(80)}
SUCCESS CHECKLIST (in priority order)
${'='.repeat(80)}

MUST HAVE (highest impact first):
1. Universal insight that transcends your activity (20 pts)
2. Community transformation with before/after evidence (20 pts)
3. Extended metaphor woven through ALL paragraphs (20 pts)
4. Sensory details across 3+ senses (15 pts)
5. Sentence variety: very short (1-4 words) + long (25+) (15 pts)
6. Vulnerability: physical symptoms + named emotions (10 pts)
7. Meaningful dialogue + quantified impact numbers

LENGTH: 800-1200 characters
TONE: Natural ${profile.studentVoice} voice, not essay-like
OUTPUT: Essay text only, no commentary.`;

  return basePrompt;
}
