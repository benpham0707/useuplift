/**
 * Essay Generation Engine
 *
 * Generates elite-level extracurricular narratives with:
 * - Literary sophistication (extended metaphor, structural innovation)
 * - Elite patterns (vulnerability, dialogue, community transformation)
 * - Authentic voice (not manufactured or robotic)
 *
 * Uses iterative improvement loop:
 * Generate → Analyze → Refine → Repeat until score ≥ 80
 */

import { callClaudeWithRetry } from '../../lib/llm/claude';
import { analyzeAuthenticity } from '../analysis/features/authenticityDetector';
import { analyzeElitePatterns } from '../analysis/features/elitePatternDetector';
import { analyzeLiterarySophistication } from '../analysis/features/literarySophisticationDetector';
import { ExperienceEntry } from '../types/experience';
import { generateNarrativeAngles, selectBestAngle, type NarrativeAngle } from './narrativeAngleGenerator';
import { validateAndRankAngles, selectBestValidatedAngle, type AngleQualityScore } from './angleQualityValidator';

// ============================================================================
// TYPES
// ============================================================================

export interface GenerationProfile {
  // Student info
  studentVoice: 'formal' | 'conversational' | 'quirky' | 'introspective';
  riskTolerance: 'low' | 'medium' | 'high'; // Based on GPA/scores
  academicStrength: 'strong' | 'moderate' | 'weak'; // 3.8+ = strong

  // Activity details
  activityType: 'academic' | 'service' | 'arts' | 'athletics' | 'work' | 'advocacy';
  role: string;
  duration: string;
  hoursPerWeek: number;

  // Content to work with
  achievements: string[];
  challenges: string[];
  relationships: string[]; // People involved
  impact: string[];

  // Generation preferences
  targetTier: 1 | 2 | 3; // 1=Harvard, 2=Top UC, 3=UC-competitive
  literaryTechniques: string[]; // Which techniques to emphasize
  avoidClichés: boolean;

  // Narrative angle (optional - will be generated if not provided)
  narrativeAngle?: NarrativeAngle;
  generateAngle?: boolean; // Set to true to auto-generate angle
}

export interface GenerationResult {
  essay: string;

  // Quality scores
  authenticityScore: number;
  elitePatternsScore: number;
  literarySophisticationScore: number;
  combinedScore: number;

  // Analysis details
  strengths: string[];
  gaps: string[];

  // Generation metadata
  iteration: number;
  techniquesUsed: string[];
  warningFlags: string[];
  narrativeAngle?: NarrativeAngle; // The angle used for generation
}

// ============================================================================
// LITERARY TECHNIQUE TEMPLATES
// ============================================================================

const LITERARY_TECHNIQUES = {
  extendedMetaphor: {
    name: 'Extended Metaphor',
    description: 'Central metaphor sustained throughout essay',
    examples: ['symphony/silence', 'light/shadow (umbra)', 'journey/path', 'ocean/waves'],
    riskLevel: 'medium',
    bestFor: ['introspective', 'conversational'],
  },

  inMediasRes: {
    name: 'In Medias Res',
    description: 'Start in middle of dramatic action',
    examples: ['A scream in the night. Mine.', 'The letter arrived on Tuesday.'],
    riskLevel: 'low',
    bestFor: ['conversational', 'quirky'],
  },

  dualScene: {
    name: 'Dual Scene Parallelism',
    description: 'Two contrasting scenes showing different sides',
    examples: ['performance vs. workshop', 'summer vs. winter', 'solo vs. team'],
    riskLevel: 'low',
    bestFor: ['all'],
  },

  definitionOpening: {
    name: 'Definition Opening',
    description: 'Begin with term definition that sets theme',
    examples: ['Umbra: the innermost, darkest part of a shadow'],
    riskLevel: 'medium',
    bestFor: ['formal', 'introspective'],
  },

  philosophicalInquiry: {
    name: 'Philosophical Inquiry',
    description: 'Open with philosophical questions',
    examples: ['Is Sophia human?', 'What makes someone human?'],
    riskLevel: 'high',
    bestFor: ['introspective', 'formal'],
  },

  montageStructure: {
    name: 'Montage Structure',
    description: 'Organize around object or list of moments',
    examples: ['laptop stickers', 'lessons from X activity'],
    riskLevel: 'low',
    bestFor: ['conversational', 'quirky'],
  },

  perspectiveShift: {
    name: 'Perspective Shift',
    description: 'Start in third person, then reveal it\'s first person',
    examples: [
      'In the lab, a student stared at the code. Three hours. No progress. How do I know? It was me.',
      'She walked into the room, hands shaking. Everyone watched. That student was me.',
    ],
    riskLevel: 'high',
    bestFor: ['quirky', 'conversational'],
    instructions: `
**PERSPECTIVE SHIFT TECHNIQUE:**

1. Open with 2-3 sentences in THIRD PERSON:
   - "In the robotics lab, a teenager stared at broken code."
   - "The vision system had failed. Three days until competition."
   - Use "a student", "a teenager", "she/he" (avoid names initially)

2. Build a little scene/tension (30-50 words)

3. Then REVEAL with first person:
   - "How do I know? I was that student."
   - "That teenager was me."
   - "Yeah. Me."

4. Continue rest of essay in first person

This creates intrigue and shows literary sophistication. The reader wonders "who is this person?" then gets the reveal.`,
  },
};

// ============================================================================
// GENERATION STRATEGY SELECTION
// ============================================================================

function selectLiteraryTechniques(profile: GenerationProfile): string[] {
  const techniques: string[] = [];

  // Based on risk tolerance
  if (profile.riskTolerance === 'high' && profile.academicStrength === 'strong') {
    // Can use sophisticated techniques
    techniques.push('philosophicalInquiry');
    techniques.push('extendedMetaphor');
  } else if (profile.riskTolerance === 'medium') {
    // Moderate sophistication
    techniques.push('extendedMetaphor');
    techniques.push('dualScene');
  } else {
    // Play it safer
    techniques.push('inMediasRes');
    techniques.push('dualScene');
  }

  // Based on student voice
  if (profile.studentVoice === 'introspective') {
    if (!techniques.includes('extendedMetaphor')) {
      techniques.push('extendedMetaphor');
    }
  }

  if (profile.studentVoice === 'quirky') {
    techniques.push('montageStructure');
  }

  // Always include these for elite tier
  if (profile.targetTier === 1) {
    if (!techniques.includes('extendedMetaphor')) {
      techniques.push('extendedMetaphor');
    }
  }

  return techniques.slice(0, 3); // Use max 3 techniques
}

export function buildGenerationPrompt(profile: GenerationProfile, techniques: string[], iteration: number = 1, angle?: NarrativeAngle): string {
  const techniqueDescriptions = techniques
    .map(t => LITERARY_TECHNIQUES[t as keyof typeof LITERARY_TECHNIQUES])
    .filter(Boolean)
    .map(t => `- ${t.name}: ${t.description}`)
    .join('\n');

  const examplesText = techniques
    .map(t => LITERARY_TECHNIQUES[t as keyof typeof LITERARY_TECHNIQUES])
    .filter(Boolean)
    .map(t => `  ${t.name}: ${t.examples.join(', ')}`)
    .join('\n');

  // Get detailed instructions for techniques that have them
  const detailedInstructions = techniques
    .map(t => LITERARY_TECHNIQUES[t as keyof typeof LITERARY_TECHNIQUES])
    .filter(tech => tech && 'instructions' in tech)
    .map(tech => (tech as any).instructions)
    .join('\n\n');

  // Build narrative angle guidance if provided
  const angleGuidance = angle ? `
🎯 **NARRATIVE ANGLE (CRITICAL - This sets you apart!):**

**Central Perspective**: "${angle.title}"
**Opening Hook**: ${angle.hook}
**Throughline**: ${angle.throughline}

**What Makes This Unique**:
- Unusual Connection: ${angle.unusualConnection}
- Philosophical Depth: ${angle.philosophicalDepth}
- Universal Insight: ${angle.universalInsight}

**IMPLEMENTATION REQUIREMENTS**:
1. Use the hook as inspiration for your opening (adapt to your voice, don't copy verbatim)
2. Maintain the throughline perspective throughout the essay
3. Connect your specific experience to the universal insight
4. Keep it GROUNDED - don't let philosophy overshadow concrete details
5. Aim for authenticity score 9+ (stay genuine, don't force the angle)

⚠️ **Critical Balance**: This angle should ENHANCE your story, not replace it with abstractions.
Connect philosophical depth to SPECIFIC moments (dialogue, sensory details, vulnerability).
` : '';

  return `Elite essay coach. Target: ${profile.targetTier === 1 ? 'Harvard/Stanford/MIT' : profile.targetTier === 2 ? 'Top UC (Berkeley/UCLA)' : 'UCLA'} (85+/100).

PROFILE: ${profile.studentVoice} voice | ${profile.role} | ${profile.duration}
Achievements: ${profile.achievements.join('; ')}
Challenges: ${profile.challenges.join('; ')}
People: ${profile.relationships.join('; ')}
Impact: ${profile.impact.join('; ')}
${angleGuidance}

LITERARY TECHNIQUES (MUST USE):
${techniqueDescriptions}

${detailedInstructions ? `${detailedInstructions}\n` : ''}

TECHNIQUE EXAMPLES:
${examplesText}

**⚠️  CRITICAL LITERARY REQUIREMENTS:**
${techniques.includes('perspectiveShift') ? `
🚨 PERSPECTIVE SHIFT REQUIRED:
- MUST start with 2-3 third-person sentences: "In the robotics lab, a teenager stared at broken code."
- Use "a student", "a teenager", "she/he" (NO first person yet!)
- Build scene/tension (30-50 words)
- THEN REVEAL: "How do I know? That was me." OR "Yeah. Me."
- Continue rest in first person
This technique is NON-NEGOTIABLE for structural innovation score (0/15 → 12/15).
` : ''}
${techniques.includes('extendedMetaphor') ? `
🚨 EXTENDED METAPHOR REQUIRED:
- Pick ONE central metaphor (music/orchestra, medical/surgery, battle/war, journey/navigation)
- Sustain it throughout with 5+ references
- Weave into narrative naturally (NOT forced)
This technique is NON-NEGOTIABLE for metaphor score (0/20 → 20/20).
` : ''}

CONTENT REQUIREMENTS (all mandatory - execute with depth):

1. VIVID OPENING: ${techniques.includes('perspectiveShift') ? 'MUST use third-person perspective shift (see above)' : 'Start with sensory detail, specific time/place, or dialogue. NOT generic ("I\'ve always been passionate").'  }
   ${!techniques.includes('perspectiveShift') ? 'Examples: "Three days before regionals, our robot missed every target" | "The fifth set of chimes" | "A scream. Mine."' : ''}

2. VULNERABILITY: Show authentic emotion/struggle with specificity.
   - Named emotions: afraid, terrified, dumbstruck, out of place, no clue
   - Physical markers: hands shaking, stomach cramped, voice cracked, jaw dropped
   - Admits limits: "I didn't know", "seemed impossible", "no idea how"
   Show BEFORE state (fear/doubt) → AFTER state (growth/confidence)

3. DIALOGUE: Include 1-2 quoted conversations that reveal character/relationship.
   NOT just attribution ("Dad said to try again")
   YES: "This is hopeless," I whispered. "Every bug is just discord," Dad said quietly.

4. HUMAN ELEMENT: Don't just name people - develop relationships with depth.
   - Show relationship BEFORE: tension, misunderstanding, distance
     Example: "Sarah won't make eye contact when I ask about specs"
   - Show evolution through interaction and dialogue
   - Show relationship AFTER: connection, collaboration, mutual respect
     Example: "Sarah started asking vision questions instead of assuming we'd figure it out"
   - Include specific metrics: "Jake confidently debugging vision algorithms"

5. COMMUNITY TRANSFORMATION: Show before/after culture shift with evidence (NOT just personal growth).
   BEFORE state: Describe team/group culture (siloed, territorial, isolated)
   Example: "12 programmers playing different songs, specialists guarding their domains"

   AFTER state: How YOU changed the culture (collaborative, open, teaching)
   Example: "Workshop transformed from territorial to collaborative"

   QUANTIFY impact: Numbers that prove change
   Example: "5 new programmers learned collaborative debugging" | "18 other teams adopted our methodology"

6. UNIVERSAL INSIGHT: Connect to broader life truth (NOT activity-specific lesson).
   Move beyond "I learned teamwork" or "debugging taught me patience"

   Connect technical to human: "Expertise without translation is just sophisticated noise"
   Connect specific to universal: "The most brilliant solo means nothing if the audience can't hear"
   Philosophical depth: What does this reveal about people/communication/leadership?

VOICE (${profile.studentVoice}):
${profile.studentVoice === 'conversational' ? '- Use parentheticals, rhetorical questions, informal asides\n- "Yeah. Me." | "(me, apparently?)" | "Want to see what broke?"' : profile.studentVoice === 'formal' ? '- Sophisticated but not pretentious\n- Measured tone, elevated vocabulary where natural' : profile.studentVoice === 'quirky' ? '- Humor, unexpected phrasing, personality\n- "because apparently our robot thinks it\'s playing miniature golf"' : '- Internal monologue, reflection\n- Thoughtful, contemplative tone'}

AVOID CLICHÉS: "smelled like", "I used to think", "changed my life", "shaped who I am", "opened my eyes", "made me realize"

STRUCTURE (800-1200 chars, 2-3 paragraphs):

**SENTENCE VARIETY (CRITICAL for literary score - REQUIRED):**
YOU MUST INCLUDE:
- **2+ VERY SHORT (1-2 words)** at emotional peaks: "No." | "Gone." | "Me." | "Bingo." | "Wrong."
- **2+ SHORT (3-5 words)**: "Hands trembled." | "Everyone watched." | "Three hours. No progress."
- **2+ LONG (25+ words)** for scene-setting or reflection
- MIX sentence types: statement, question, fragment, compound
**This is non-negotiable** - literary score requires sentence variety!

**SENSORY IMMERSION (3+ senses woven into action):**
- TOUCH: grease-stained hands, cold metal, trembling fingers
- SOUND: voice cracked, keyboard clicking, motors whirring
- SIGHT: blinking cursor, digital static, broken code
- SMELL/TASTE: workshop smells, bitter coffee (if natural)
Integrate into narrative action (NOT detached: "the air smelled like...")

${iteration > 1 ? `\n**ITERATION ${iteration} FOCUS:**
- Strengthen literary techniques (especially metaphor consistency)
- Deepen human element (show relationship evolution with dialogue)
- Enhance community transformation (quantify cultural shift)
- Sharpen universal insight (connect to broader human truth)
- Ensure ALL 6 requirements present with depth\n` : ''}

Generate essay now. Return ONLY the essay text, no commentary or preamble.`;
}

// ============================================================================
// GENERATION & ITERATION
// ============================================================================

/**
 * Multi-stage angle selection with comprehensive quality validation
 *
 * Process:
 * 1. Generate 10+ angles
 * 2. Validate each with quality metrics (grounding, bridge, authenticity, implementability)
 * 3. Filter out "avoid" recommendations
 * 4. Rank remaining by overall quality
 * 5. Select best with detailed reporting
 */
export function selectOptimalAngle(angles: NarrativeAngle[], profile: GenerationProfile): NarrativeAngle {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`📊 MULTI-STAGE ANGLE VALIDATION (${angles.length} candidates)`);
  console.log(`${'='.repeat(80)}\n`);

  // Stage 1: Validate all angles
  console.log(`Stage 1: Validating angle quality...`);
  const validated = validateAndRankAngles(angles, profile);

  // Stage 2: Filter by recommendation
  const excellent = validated.filter(v => v.recommendation === 'excellent');
  const good = validated.filter(v => v.recommendation === 'good');
  const acceptable = validated.filter(v => v.recommendation === 'acceptable');
  const risky = validated.filter(v => v.recommendation === 'risky');
  const avoid = validated.filter(v => v.recommendation === 'avoid');

  console.log(`\nStage 2: Quality Distribution:`);
  console.log(`  • Excellent: ${excellent.length}`);
  console.log(`  • Good: ${good.length}`);
  console.log(`  • Acceptable: ${acceptable.length}`);
  console.log(`  • Risky: ${risky.length}`);
  console.log(`  • Avoid: ${avoid.length}\n`);

  // Stage 3: Select best usable angle
  const usable = [...excellent, ...good, ...acceptable];

  if (usable.length === 0) {
    console.warn(`⚠️  WARNING: All angles flagged as risky/avoid. Using least-bad option.\n`);
    return validated[0].angle;
  }

  const selected = usable[0];

  // Stage 4: Report selection
  console.log(`Stage 3: Selected Angle`);
  console.log(`${'─'.repeat(80)}`);
  console.log(`Title: "${selected.angle.title}"`);
  console.log(`Originality: ${selected.angle.originality}/10 | Risk: ${selected.angle.riskLevel}`);
  console.log(`\n🎯 Quality Scores:`);
  console.log(`  • Overall Quality: ${selected.overallQuality}/100`);
  console.log(`  • Grounding: ${selected.groundingScore}/100`);
  console.log(`  • Bridge (Tech-Human): ${selected.bridgeScore}/100`);
  console.log(`  • Authenticity Potential: ${selected.authenticityPotential}/100`);
  console.log(`  • Implementability: ${selected.implementabilityScore}/100`);
  console.log(`\n✅ Recommendation: ${selected.recommendation.toUpperCase()} (confidence: ${Math.round(selected.confidence * 100)}%)`);

  if (selected.strengths.length > 0) {
    console.log(`\n💪 Strengths:`);
    selected.strengths.forEach(s => console.log(`  • ${s}`));
  }

  if (selected.warnings.length > 0) {
    console.log(`\n⚠️  Warnings:`);
    selected.warnings.forEach(w => console.log(`  • ${w}`));
  }

  if (selected.redFlags.length > 0) {
    console.log(`\n🚨 Red Flags:`);
    selected.redFlags.forEach(f => console.log(`  • ${f}`));
  }

  console.log(`\n${'='.repeat(80)}\n`);

  return selected.angle;
}

export async function generateEssay(
  profile: GenerationProfile,
  maxIterations: number = 3
): Promise<GenerationResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`GENERATING ESSAY: ${profile.role}`);
  console.log(`Target Tier: ${profile.targetTier}, Voice: ${profile.studentVoice}, Risk: ${profile.riskTolerance}`);
  console.log(`${'='.repeat(80)}\n`);

  // Generate narrative angle if requested (Session 18 optimization)
  let narrativeAngle = profile.narrativeAngle;

  if (profile.generateAngle && !narrativeAngle) {
    console.log(`🎨 GENERATING NARRATIVE ANGLES...\n`);

    const angles = await generateNarrativeAngles({
      profile,
      numAngles: 10,
      prioritize: 'originality',
    });

    console.log(`✓ Generated ${angles.length} unique angles`);

    // Use smart selection (prioritize moderate risk + grounded)
    narrativeAngle = selectOptimalAngle(angles, profile);

    console.log(`\n🎯 SELECTED ANGLE: "${narrativeAngle.title}"`);
    console.log(`   Originality: ${narrativeAngle.originality}/10 | Risk: ${narrativeAngle.riskLevel}`);
    console.log(`   Hook: "${narrativeAngle.hook}"`);
    console.log(`   Connection: ${narrativeAngle.unusualConnection}\n`);
  } else if (narrativeAngle) {
    console.log(`🎯 USING PROVIDED ANGLE: "${narrativeAngle.title}"\n`);
  }

  // Select techniques
  const techniques = profile.literaryTechniques.length > 0
    ? profile.literaryTechniques
    : selectLiteraryTechniques(profile);

  console.log(`📝 Selected Literary Techniques: ${techniques.join(', ')}\n`);

  let bestResult: GenerationResult | null = null;
  let iteration = 1;

  while (iteration <= maxIterations) {
    console.log(`\n${'─'.repeat(80)}`);
    console.log(`ITERATION ${iteration}/${maxIterations}`);
    console.log(`${'─'.repeat(80)}\n`);

    // Generate essay (pass narrative angle if available)
    const prompt = buildGenerationPrompt(profile, techniques, iteration, narrativeAngle);

    console.log(`Generating essay with Claude...`);
    const response = await callClaudeWithRetry<{ essay: string }>(
      prompt,
      {
        temperature: 0.7, // Some creativity but not too wild
        maxTokens: 2000,
        useJsonMode: false, // Get plain text
      }
    );

    const essay = response.content;
    console.log(`✓ Generated ${essay.length} characters\n`);

    // Analyze the generated essay
    console.log(`Analyzing generated essay...`);

    const authenticity = analyzeAuthenticity(essay);
    const elitePatterns = analyzeElitePatterns(essay);
    const literary = analyzeLiterarySophistication(essay);

    const authenticityScore = authenticity.authenticity_score;
    const elitePatternsScore = elitePatterns.overallScore;
    const literaryScore = literary.overallScore;

    // Calculate combined score (20% auth, 40% elite, 40% literary)
    const combinedScore = Math.round(
      (authenticityScore / 10) * 20 +
      (elitePatternsScore / 100) * 40 +
      (literaryScore / 100) * 40
    );

    console.log(`\n📊 SCORES:`);
    console.log(`  Authenticity:            ${authenticityScore.toFixed(1)}/10  → ${Math.round((authenticityScore / 10) * 20)}/20`);
    console.log(`  Elite Patterns:          ${elitePatternsScore}/100 → ${Math.round((elitePatternsScore / 100) * 40)}/40`);
    console.log(`  Literary Sophistication: ${literaryScore}/100 → ${Math.round((literaryScore / 100) * 40)}/40`);
    console.log(`  COMBINED:                ${combinedScore}/100\n`);

    // Collect feedback
    const strengths = [...elitePatterns.strengths, ...literary.strengths];
    const gaps = [...elitePatterns.gaps, ...literary.improvements];
    const warningFlags: string[] = [];

    if (authenticityScore < 7) {
      warningFlags.push('low_authenticity');
      gaps.push('Voice sounds manufactured or robotic - make it more conversational');
    }

    if (authenticity.voice_type === 'essay' || authenticity.voice_type === 'robotic') {
      warningFlags.push('essay_voice');
      gaps.push('Remove essay clichés and manufactured phrases');
    }

    const result: GenerationResult = {
      essay,
      authenticityScore,
      elitePatternsScore,
      literarySophisticationScore: literaryScore,
      combinedScore,
      strengths,
      gaps,
      iteration,
      techniquesUsed: techniques,
      warningFlags,
      narrativeAngle, // Include the angle used
    };

    // Track best result
    if (!bestResult || combinedScore > bestResult.combinedScore) {
      bestResult = result;
    }

    // Check if we've hit target
    const targetScore = profile.targetTier === 1 ? 85 : profile.targetTier === 2 ? 75 : 65;

    if (combinedScore >= targetScore) {
      console.log(`\n✅ TARGET REACHED: ${combinedScore}/100 (target: ${targetScore})`);
      console.log(`Stopping after ${iteration} iteration(s)\n`);
      return result;
    }

    console.log(`\n⚠️  Below target (${combinedScore}/100 < ${targetScore})`);
    console.log(`Key gaps: ${gaps.slice(0, 3).join('; ')}`);

    iteration++;
  }

  console.log(`\n⚠️  Max iterations reached. Returning best result: ${bestResult!.combinedScore}/100\n`);
  return bestResult!;
}

// ============================================================================
// TRANSFORMATION SYSTEM (Weak → Elite)
// ============================================================================

export async function transformEssay(
  weakEssay: string,
  profile: GenerationProfile
): Promise<GenerationResult> {
  console.log(`\n${'='.repeat(80)}`);
  console.log(`TRANSFORMING WEAK ESSAY → ELITE`);
  console.log(`${'='.repeat(80)}\n`);

  // First, analyze the weak essay
  console.log(`Analyzing input essay...`);
  const initialAuth = analyzeAuthenticity(weakEssay);
  const initialElite = analyzeElitePatterns(weakEssay);
  const initialLiterary = analyzeLiterarySophistication(weakEssay);

  const initialScore = Math.round(
    (initialAuth.authenticity_score / 10) * 20 +
    (initialElite.overallScore / 100) * 40 +
    (initialLiterary.overallScore / 100) * 40
  );

  console.log(`\n📊 INITIAL SCORES:`);
  console.log(`  Combined: ${initialScore}/100`);
  console.log(`  Authenticity: ${initialAuth.authenticity_score}/10 (${initialAuth.voice_type})`);
  console.log(`  Elite Patterns: ${initialElite.overallScore}/100 (Tier ${initialElite.tier})`);
  console.log(`  Literary: ${initialLiterary.overallScore}/100 (Tier ${initialLiterary.tier})\n`);

  // Identify specific problems
  const problems: string[] = [];
  const solutions: string[] = [];

  if (initialAuth.authenticity_score < 7) {
    problems.push('Low authenticity - sounds manufactured');
    solutions.push('Add conversational voice, remove essay clichés');
  }

  if (!initialElite.vulnerability || initialElite.vulnerability.score < 3) {
    problems.push('No vulnerability or emotional stakes');
    solutions.push('Add specific moment of fear, doubt, or physical symptoms');
  }

  if (!initialElite.dialogue.hasDialogue) {
    problems.push('No quoted dialogue');
    solutions.push('Include actual conversation to prove moment happened');
  }

  if (!initialElite.quantifiedImpact.hasMetrics) {
    problems.push('No specific metrics');
    solutions.push('Add concrete numbers: people reached, money raised, etc.');
  }

  if (!initialElite.communityTransformation.hasContrast) {
    problems.push('No community transformation');
    solutions.push('Show how community changed (before/after)');
  }

  if (!initialLiterary.extendedMetaphor.hasMetaphor) {
    problems.push('No extended metaphor');
    solutions.push('Add central metaphor sustained throughout');
  }

  console.log(`⚠️  PROBLEMS IDENTIFIED (${problems.length}):`);
  problems.forEach(p => console.log(`  • ${p}`));

  console.log(`\n💡 SOLUTIONS TO APPLY:`);
  solutions.forEach(s => console.log(`  → ${s}`));

  // Build transformation prompt
  const transformPrompt = `You are transforming a weak extracurricular essay into an elite one.

ORIGINAL ESSAY (Score: ${initialScore}/100):
"${weakEssay}"

IDENTIFIED PROBLEMS:
${problems.map((p, i) => `${i + 1}. ${p}`).join('\n')}

YOUR TASK:
Transform this into an essay that would score 85+ by addressing ALL problems:

${solutions.map((s, i) => `${i + 1}. ${s}`).join('\n')}

TRANSFORMATION REQUIREMENTS:

1. **Preserve Core Content**: Keep the facts, achievements, and basic story
2. **Add Vulnerability**: Include a specific moment where student felt afraid, out of place, or uncertain
3. **Add Dialogue**: Quote at least one conversation (even if reconstructed from memory)
4. **Add Metrics**: Include specific numbers where possible
5. **Show Community Change**: Before/after contrast showing how others changed
6. **Add Extended Metaphor**: Choose one central image and weave it throughout
7. **Fix Voice**: Make it sound authentically ${profile.studentVoice}, remove manufactured phrases

SPECIFIC TECHNIQUES TO ADD:
${profile.literaryTechniques.length > 0 ? profile.literaryTechniques.join(', ') : selectLiteraryTechniques(profile).join(', ')}

VOICE STYLE: ${profile.studentVoice}
- ${profile.studentVoice === 'conversational' ? 'Use parenthetical asides, questions, informal language' : ''}
- ${profile.studentVoice === 'formal' ? 'Sophisticated but accessible' : ''}
- ${profile.studentVoice === 'quirky' ? 'Show personality with humor' : ''}
- ${profile.studentVoice === 'introspective' ? 'Internal monologue and reflection' : ''}

LENGTH: Transform into 800-1200 characters

EXAMPLE TRANSFORMATION:

WEAK (Resume Bullet):
"As Secretary General, I organized committees and led the team to over 15 conferences..."

ELITE (Narrative):
"Two hours before NHSMUN, our delegate for Syria dropped out. 'We're going to fail,' my co-chair whispered. I looked at our research binder—47 pages we'd spent six weeks preparing. 'No,' I replied. 'We're going to teach someone everything we know in two hours.' [continues with vulnerability, metrics, and community impact]"

Generate the transformed essay now. Make it score 85+.

Return ONLY the transformed essay, no additional commentary.`;

  // Generate transformation
  console.log(`\nGenerating transformation...`);
  const response = await callClaudeWithRetry<{ essay: string }>(
    transformPrompt,
    {
      temperature: 0.7,
      maxTokens: 2000,
      useJsonMode: false,
    }
  );

  const transformedEssay = response.content;
  console.log(`✓ Generated ${transformedEssay.length} characters\n`);

  // Analyze transformed essay
  console.log(`Analyzing transformed essay...`);
  const finalAuth = analyzeAuthenticity(transformedEssay);
  const finalElite = analyzeElitePatterns(transformedEssay);
  const finalLiterary = analyzeLiterarySophistication(transformedEssay);

  const finalScore = Math.round(
    (finalAuth.authenticity_score / 10) * 20 +
    (finalElite.overallScore / 100) * 40 +
    (finalLiterary.overallScore / 100) * 40
  );

  console.log(`\n📊 FINAL SCORES:`);
  console.log(`  Combined: ${finalScore}/100 (↑ ${finalScore - initialScore})`);
  console.log(`  Authenticity: ${finalAuth.authenticity_score}/10 (${finalAuth.voice_type})`);
  console.log(`  Elite Patterns: ${finalElite.overallScore}/100 (Tier ${finalElite.tier})`);
  console.log(`  Literary: ${finalLiterary.overallScore}/100 (Tier ${finalLiterary.tier})\n`);

  return {
    essay: transformedEssay,
    authenticityScore: finalAuth.authenticity_score,
    elitePatternsScore: finalElite.overallScore,
    literarySophisticationScore: finalLiterary.overallScore,
    combinedScore: finalScore,
    strengths: [...finalElite.strengths, ...finalLiterary.strengths],
    gaps: [...finalElite.gaps, ...finalLiterary.improvements],
    iteration: 1,
    techniquesUsed: profile.literaryTechniques,
    warningFlags: [],
  };
}
