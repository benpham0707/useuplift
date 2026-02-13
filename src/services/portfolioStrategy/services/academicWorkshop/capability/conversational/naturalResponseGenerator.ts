// @ts-nocheck
/**
 * Natural Response Generator
 *
 * Replaces rigid template-based responses with LLM-generated natural conversation.
 * Every response sounds like a real expert advisor - warm, knowledgeable,
 * and adapted to the specific student and moment.
 *
 * Key Principles:
 * 1. NO TEMPLATES - Everything is generated naturally
 * 2. CONTEXT-AWARE - Adapts style based on situation
 * 3. KNOWLEDGE-RICH - Weaves in relevant data when helpful
 * 4. TRANSPARENT REASONING - Shows thinking naturally, not in rigid sections
 */

import { callClaude } from '../../../../../../lib/llm/claude';

// Model constants
const MODELS = {
  sonnet: 'claude-sonnet-4-5-20250929',
  haiku: 'claude-haiku-4-5-20251001',
} as const;
import {
  AP_COURSES,
  getAPCourse,
  getCoursesForMajor,
  getLoadGuidance,
  formatPassRate,
  type APCourseProfile,
} from './academicCourseKnowledgeBase';
import {
  generateEngagingHook,
  type HookContext,
  type GeneratedHook,
} from './engagingHookGenerator';
import {
  AP_SCORE_PERCEPTIONS,
  getAdmittedProfile,
  getAPExpectationForMajor,
  generateRealStakesStatement,
  findRelevantFacts,
  type QuickFact,
} from './realStakesDatabase';
import type { ProfileInsight, StrategicQuestion } from './insightDrivenAdvisor';
import type { SubjectArea, SubjectPattern } from './types';

// ============================================================================
// TYPES
// ============================================================================

export type ConversationStyle =
  | 'curious_explorer' // Building rapport, opening sensitive topics
  | 'strategic_teacher' // Student lacks knowledge, sharing expertise
  | 'honest_mirror' // Major mismatch, showing reality
  | 'gentle_challenger' // Capable student playing safe
  | 'empathetic_validator' // Sensitive topic, needs support first
  | 'connecting_synthesizer' // Revealing patterns student hasn't seen
  | 'practical_advisor'; // Concrete recommendations and next steps

export interface ConversationContext {
  // Student profile
  student: {
    name?: string;
    grade: number;
    intendedMajor: string;
    schoolType: string;
    overallGPA: number;
    trajectory: 'ascending' | 'descending' | 'stable' | 'erratic';
  };

  // Academic patterns we've identified
  academicPatterns: {
    subjects: Array<{
      subject: SubjectArea;
      gpa: number;
      effort?: number;
      trend: 'improving' | 'declining' | 'stable';
      currentLevel: string;
      courses: string[];
    }>;
    strongestSubject?: SubjectArea;
    weakestSubject?: SubjectArea;
    effortGapSubjects?: SubjectArea[]; // Low effort + high grades
    strugglingSubjects?: SubjectArea[]; // High effort + lower grades
  };

  // The insights we've extracted
  insights: ProfileInsight[];

  // Current conversation state
  currentExchange: {
    phase: 'opening' | 'exploration' | 'synthesis' | 'planning';
    turnNumber: number;
    ourLastQuestion?: StrategicQuestion;
    theirResponse?: string;
    emotionalTone?: 'positive' | 'negative' | 'neutral' | 'anxious' | 'defensive' | 'open';
    whatWeLearned?: string[];
  };

  // What we still need to understand
  informationGaps: string[];

  // Relevant knowledge to potentially include
  relevantKnowledge?: {
    apCourses?: APCourseProfile[];
    majorRequirements?: Array<{ course: APCourseProfile; relevance: string }>;
    workloadGuidance?: string[];
    pairingAdvice?: string[];
    statistics?: Array<{ fact: string; source: string }>;
  };

  /** Optional: Pre-assembled research context from unifiedResearchAssemblyService */
  assembledResearchContext?: string;

  /**
   * CONVERSATION STATE TRACKING - Prevents repetition
   * Tracks what points/insights have already been communicated so we don't repeat them.
   */
  pointsAlreadyCovered?: {
    /** Specific data points mentioned (e.g., "BC 81% pass rate", "rigor importance 64%") */
    dataPointsMentioned: string[];
    /** Key arguments made (e.g., "transcript shows capability not potential", "BC > AB for CS") */
    argumentsMade: string[];
    /** Course recommendations given (e.g., "recommended BC", "suggested Physics C") */
    courseRecommendations: string[];
    /** Specific concerns addressed (e.g., "addressed GPA fear", "explained effort gap") */
    concernsAddressed: string[];
  };
}

export interface GeneratedResponse {
  message: string;
  style: ConversationStyle;
  knowledgeUsed: string[]; // What knowledge was woven in
  nextQuestionPurpose?: string;
  strategyUpdates?: string[];
  /**
   * Points covered in this response - used to prevent repetition in future turns
   */
  pointsCovered?: {
    dataPointsMentioned: string[];
    argumentsMade: string[];
    courseRecommendations: string[];
    concernsAddressed: string[];
  };
}

export interface OpeningContext {
  student: ConversationContext['student'];
  academicPatterns: ConversationContext['academicPatterns'];
  insights: ProfileInsight[];
  topPriorityQuestion: StrategicQuestion;
  /** Optional: Pre-assembled research context for richer LLM prompts */
  assembledResearchContext?: string;
}

// ============================================================================
// STYLE SELECTION
// ============================================================================

/**
 * Determine the appropriate conversation style based on context
 */
export function selectConversationStyle(context: ConversationContext): ConversationStyle {
  const { currentExchange, insights, academicPatterns } = context;

  // If student shared something difficult, validate first
  if (currentExchange.emotionalTone === 'anxious' || currentExchange.emotionalTone === 'negative') {
    return 'empathetic_validator';
  }

  // If student is defensive, be curious rather than pushing
  if (currentExchange.emotionalTone === 'defensive') {
    return 'curious_explorer';
  }

  // If there's a major mismatch they haven't acknowledged
  const majorMismatch = insights.find(
    (i) => i.observation.toLowerCase().includes('mismatch') || i.observation.toLowerCase().includes('elsewhere')
  );
  if (majorMismatch && currentExchange.phase !== 'opening') {
    return 'honest_mirror';
  }

  // If student is capable but playing safe (low effort + high grades)
  if (academicPatterns.effortGapSubjects && academicPatterns.effortGapSubjects.length > 0) {
    return 'gentle_challenger';
  }

  // If we're connecting dots across multiple areas
  if (insights.length >= 3 && currentExchange.phase === 'synthesis') {
    return 'connecting_synthesizer';
  }

  // If we're ready to give recommendations
  if (currentExchange.phase === 'planning') {
    return 'practical_advisor';
  }

  // If student lacks knowledge about APs, colleges, etc.
  if (
    currentExchange.theirResponse?.toLowerCase().includes("don't know") ||
    currentExchange.theirResponse?.toLowerCase().includes('not sure') ||
    currentExchange.theirResponse?.toLowerCase().includes('scared') ||
    currentExchange.theirResponse?.toLowerCase().includes('worried')
  ) {
    return 'strategic_teacher';
  }

  // Default to curious exploration
  return 'curious_explorer';
}

// ============================================================================
// KNOWLEDGE RETRIEVAL
// ============================================================================

/**
 * Gather relevant knowledge based on conversation context
 */
export function gatherRelevantKnowledge(context: ConversationContext): ConversationContext['relevantKnowledge'] {
  const knowledge: ConversationContext['relevantKnowledge'] = {
    apCourses: [],
    majorRequirements: [],
    workloadGuidance: [],
    pairingAdvice: [],
    statistics: [],
  };

  // Get major-relevant courses
  if (context.student.intendedMajor) {
    const majorCourses = getCoursesForMajor(context.student.intendedMajor);
    knowledge.majorRequirements = majorCourses;
    knowledge.apCourses = majorCourses.slice(0, 3).map((c) => c.course);
  }

  // Get courses relevant to their subjects
  for (const subjectPattern of context.academicPatterns.subjects) {
    // Try to find relevant AP courses for this subject area
    const subjectAPs = Object.values(AP_COURSES).filter((c) => c.category === subjectPattern.subject);
    knowledge.apCourses?.push(...subjectAPs.slice(0, 2));
  }

  // Get grade-appropriate load guidance
  const loadGuidance = getLoadGuidance(context.student.grade as 9 | 10 | 11 | 12, context.student.schoolType);
  if (loadGuidance) {
    knowledge.workloadGuidance = loadGuidance.notes;
  }

  // Add relevant statistics based on context
  if (context.academicPatterns.effortGapSubjects && context.academicPatterns.effortGapSubjects.length > 0) {
    knowledge.statistics?.push({
      fact: 'Students who take more rigorous courses than necessary typically outperform those who play it safe - both in high school outcomes and college preparation.',
      source: 'Educational research on academic challenge',
    });
  }

  return knowledge;
}

// ============================================================================
// RESPONSE GENERATION
// ============================================================================

/**
 * Generate a natural, flowing conversation opener
 */
export async function generateNaturalOpening(context: OpeningContext): Promise<GeneratedResponse> {
  const style = selectStyleForOpening(context);
  const knowledge = gatherRelevantKnowledge({
    student: context.student,
    academicPatterns: context.academicPatterns,
    insights: context.insights,
    currentExchange: { phase: 'opening', turnNumber: 0 },
    informationGaps: [],
  });

  const prompt = buildOpeningPrompt(context, style, knowledge);

  try {
    console.log('[NaturalResponseGenerator] Making LLM call for opening...');
    const response = await callClaude<string>({
      model: MODELS.sonnet,
      maxTokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content || '';

    if (!message) {
      console.error('[NaturalResponseGenerator] LLM returned empty content');
      throw new Error('Empty response from LLM');
    }

    console.log('[NaturalResponseGenerator] LLM call successful, response length:', message.length);

    // Use async LLM-based extraction for accurate point tracking
    const pointsCovered = await extractPointsCoveredAsync(message);

    return {
      message,
      style,
      knowledgeUsed: extractKnowledgeUsed(message, knowledge),
      nextQuestionPurpose: context.topPriorityQuestion.purpose,
      pointsCovered,
    };
  } catch (error) {
    console.error('[NaturalResponseGenerator] Opening generation failed:', error);
    // DO NOT fallback silently - throw to surface the issue
    throw new Error(`LLM call failed for opening: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate a natural response to student input
 */
export async function generateNaturalResponse(context: ConversationContext): Promise<GeneratedResponse> {
  const style = selectConversationStyle(context);
  const knowledge = gatherRelevantKnowledge(context);
  const prompt = buildResponsePrompt(context, style, knowledge);

  try {
    console.log('[NaturalResponseGenerator] Making LLM call for response...');
    const response = await callClaude<string>({
      model: MODELS.sonnet,
      maxTokens: 1500,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content || '';

    if (!message) {
      console.error('[NaturalResponseGenerator] LLM returned empty content for response');
      throw new Error('Empty response from LLM');
    }

    console.log('[NaturalResponseGenerator] Response LLM call successful, length:', message.length);

    // Use async LLM-based extraction for accurate point tracking
    const pointsCovered = await extractPointsCoveredAsync(message);

    return {
      message,
      style,
      knowledgeUsed: extractKnowledgeUsed(message, knowledge),
      strategyUpdates: extractStrategyUpdates(message),
      pointsCovered,
    };
  } catch (error) {
    console.error('[NaturalResponseGenerator] Response generation failed:', error);
    throw new Error(`LLM call failed for response: ${error instanceof Error ? error.message : String(error)}`);
  }
}

// ============================================================================
// PROMPT BUILDING
// ============================================================================

function buildOpeningPrompt(
  context: OpeningContext,
  style: ConversationStyle,
  knowledge: ConversationContext['relevantKnowledge']
): string {
  const styleGuidance = getStyleGuidance(style);

  // Generate an engaging hook using the hook generator
  const hookContext: HookContext = {
    student: context.student,
    academicPatterns: context.academicPatterns,
    insights: context.insights,
  };
  const hook = generateEngagingHook(hookContext);

  // Get peer comparison data for their major
  const admittedProfile = getAdmittedProfile(context.student.intendedMajor);

  // Get relevant quick facts
  const majorTags = context.student.intendedMajor.toLowerCase().split(' ');
  const relevantFacts = findRelevantFacts([...majorTags, 'rigor', 'top'], 3);

  return `You are an expert academic advisor having a one-on-one conversation with a high school student. Your goal is to provide genuinely helpful, personalized guidance with REAL DATA and SPECIFIC stakes - not generic advice.

## Student Profile
- Grade: ${context.student.grade}th
- Intended Major: ${context.student.intendedMajor}
- School Type: ${context.student.schoolType}
- Overall GPA: ${context.student.overallGPA}
- Trajectory: ${context.student.trajectory}

## Academic Patterns I've Identified
${context.academicPatterns.subjects
  .map(
    (s) =>
      `- ${s.subject}: ${s.gpa} GPA (${s.trend})${s.effort !== undefined ? `, ${s.effort}% effort` : ''}, currently in ${s.currentLevel}`
  )
  .join('\n')}
${context.academicPatterns.strongestSubject ? `\nStrongest: ${context.academicPatterns.strongestSubject}` : ''}
${context.academicPatterns.weakestSubject ? `Weakest: ${context.academicPatterns.weakestSubject}` : ''}
${context.academicPatterns.effortGapSubjects?.length ? `\nEFFORT GAP DETECTED: In ${context.academicPatterns.effortGapSubjects.join(', ')}, student shows low effort + high grades = untapped potential` : ''}

## REQUIRED OPENING HOOK (Use this or improve upon it - it's data-driven and engaging)
"${hook.hook}"

Hook Type: ${hook.type}
Data Points Used: ${hook.dataPoints.join(', ')}
Follow-up Question: "${hook.followUp}"
Why This Works: ${hook.psychologicalLever}

## The Strategic Question I Want to Explore
${context.topPriorityQuestion.question}
- Purpose: ${context.topPriorityQuestion.purpose}
- What I'm testing: ${context.topPriorityQuestion.hypothesis}

## VERIFIED DATA FOR ${context.student.intendedMajor?.toUpperCase() || 'THIS MAJOR'} (Cite sources when relevant)
${admittedProfile ? `
**Course Expectations for ${admittedProfile.major}:**
${admittedProfile.expectedCourses.slice(0, 3).map((c) => `- ${c.course} (${c.expectationLevel}): ${c.reasoning}`).join('\n')}

**Key Insight:** "${admittedProfile.keyInsight}"

**CITABLE FACTS:**
${admittedProfile.verifiedFacts?.slice(0, 3).map((f) => `- ${f}`).join('\n') || '- See academicResearchFoundation for verified statistics'}
` : 'No specific peer data available for this major.'}

${context.assembledResearchContext ? `
## COMPREHENSIVE RESEARCH CONTEXT (Use for deep, expert-level guidance)
${context.assembledResearchContext}
` : ''}

## Quick Facts to Reference (if relevant)
${relevantFacts.map((f) => `- ${f.fact}`).join('\n') || 'No directly relevant quick facts.'}

## AP Score Reality (use if discussing APs)
- Score of 3: "${AP_SCORE_PERCEPTIONS[3].admissionsPerception}"
- Score of 4: "${AP_SCORE_PERCEPTIONS[4].admissionsPerception}"
- Score of 5: "${AP_SCORE_PERCEPTIONS[5].admissionsPerception}"

## Key Insights (USE THIS SPECIFIC DATA - don't make up generic advice)
${context.insights
  .slice(0, 2)
  .map((i) => `**Insight:** ${i.observation}
**What this means:** ${i.interpretation}
**Specific recommendation:** ${i.strategicImplication}`)
  .join('\n\n')}

## Relevant Course Knowledge
${knowledge?.apCourses?.length ? `AP Courses:\n${knowledge.apCourses.map((c) => `- ${c.name}: ${formatPassRate(c.passRate)} pass rate, ${c.perceivedDifficulty} difficulty`).join('\n')}` : ''}
${knowledge?.majorRequirements?.length ? `\nCourses for ${context.student.intendedMajor}:\n${knowledge.majorRequirements.slice(0, 3).map((r) => `- ${r.course.name}: ${r.relevance}`).join('\n')}` : ''}

## Your Style for This Response
${styleGuidance}

## CONVERSATION EFFICIENCY (CRITICAL - Read Carefully)

**START STRONG - NO THROAT-CLEARING:**
- NEVER start with "I've been looking at your academic record" or similar setup phrases
- NEVER use "Here's what this means for [major] admissions:" as a transition
- NEVER say "That's exactly what I suspected" or "interesting" observations
- Jump DIRECTLY into the most compelling insight or data point
- Your FIRST sentence should contain actual substance, not meta-commentary

**GOOD OPENING EXAMPLES:**
- "You're getting 3.95 in Pre-Calc on minimal effort—that's diagnostic data, not just a grade."
- "Stanford rates 'rigor of record' as 'very important.' Your transcript currently shows capable, not challenged."
- "BC has an 81% pass rate—higher than AB's 61%. For students who find math easy, it's often more engaging."

**BAD OPENING EXAMPLES (NEVER USE):**
- "I've been looking at your academic record, and something interesting jumped out at me."
- "Here's what this means for CS admissions:"
- "That's exactly what I suspected, and it's actually important diagnostic information."
- "Let me explain why this matters..."

**FRONT-LOAD HIGH-VALUE INSIGHTS:**
The most important admissions insights should come FIRST, not buried later:
- College weighting (3.7 AP > 3.95 Honors)
- Rigor expectations (CDS "very important" ratings)
- Course placement benefits (BC → Calc III skip)
These are decision-changing facts. Lead with them.

## TONE GUIDELINES
- Focus on WHAT GETS THEM ADMITTED, not personal development
- If they mention self-learning/personal projects, acknowledge this as POSITIVE evidence of interest
- Frame self-learning as COMPLEMENTING formal coursework, not replacement
- Explain why specific courses help admission (course placement, demonstrated rigor, peer expectations)
- Don't lecture—recommend and explain value

## QUALITY REQUIREMENTS
- Every point must be DISTINCT - no rephrasing the same idea multiple ways
- Use the SPECIFIC recommendations from insights above (course names, placement benefits)
- The transcript shows capability level to colleges - they can't see "hidden potential"
- Each sentence should add NEW information, not restate previous sentences
- If you find yourself explaining the same concept twice, DELETE the weaker version

## CITATION GUIDELINES
- When citing statistics, use verified sources:
  * AP pass rates: "College Board 2024 data shows..."
  * Admissions importance: "NACAC research indicates..."
  * College expectations: "Per [College]'s Common Data Set..."
- DO NOT make up percentages like "X% of admits took Y course" - colleges don't publish this
- Use qualitative language for unverifiable claims: "selective colleges generally expect..." rather than fabricated percentages

## FORMAT
150-250 words. Dense with specific facts. No filler sentences. End with a question.

Generate the opening message now:`;
}

function buildResponsePrompt(
  context: ConversationContext,
  style: ConversationStyle,
  knowledge: ConversationContext['relevantKnowledge']
): string {
  const styleGuidance = getStyleGuidance(style);

  // Get admitted student profile for peer comparisons
  const admittedProfile = getAdmittedProfile(context.student.intendedMajor);

  // Detect if student mentioned fear/concern about APs
  const theirResponse = context.currentExchange.theirResponse?.toLowerCase() || '';
  const mentionedFear = theirResponse.includes('scared') || theirResponse.includes('worried') ||
                       theirResponse.includes('afraid') || theirResponse.includes('hard');
  const mentionedAP = theirResponse.includes('ap') || theirResponse.includes('calculus') ||
                      theirResponse.includes('physics');

  // Generate real stakes statement if playing safe
  let realStakesContext = '';
  if (context.academicPatterns.effortGapSubjects?.length) {
    const effortSubject = context.academicPatterns.subjects.find(
      s => context.academicPatterns.effortGapSubjects?.includes(s.subject)
    );
    if (effortSubject) {
      realStakesContext = generateRealStakesStatement('low_effort', {
        gpa: effortSubject.gpa,
        effort: effortSubject.effort,
      });
    }
  }

  return `You are an expert academic advisor in an ongoing conversation with a high school student.

## Student Profile
- Grade: ${context.student.grade}th
- Intended Major: ${context.student.intendedMajor}
- Overall GPA: ${context.student.overallGPA}
- Trajectory: ${context.student.trajectory}

## What I Asked
${context.currentExchange.ourLastQuestion?.question || 'Opening question about their experience'}
(Purpose: ${context.currentExchange.ourLastQuestion?.purpose || 'Understanding their perspective'})

## What They Said
"${context.currentExchange.theirResponse}"

## Emotional Tone I'm Detecting
${context.currentExchange.emotionalTone || 'neutral'}

## What I Learned From This Response
${context.currentExchange.whatWeLearned?.map((l) => `- ${l}`).join('\n') || '- Analyzing...'}

## Key Insights About This Student (USE THIS SPECIFIC DATA)
${context.insights
  .slice(0, 3)
  .map((i) => `**Insight:** ${i.observation}
**What this means:** ${i.interpretation}
**Specific recommendation:** ${i.strategicImplication}
**Evidence:** ${i.evidence.join('; ')}`)
  .join('\n\n')}

## What I Still Need to Understand
${context.informationGaps.map((g) => `- ${g}`).join('\n') || '- Continue exploring their perspective'}

## VERIFIED DATA TO USE (cite sources when relevant)
${admittedProfile ? `
Course Expectations for ${admittedProfile.major}:
${admittedProfile.expectedCourses.slice(0, 2).map((c) => `- ${c.course} (${c.expectationLevel}): ${c.reasoning}`).join('\n')}
${admittedProfile.verifiedFacts?.length ? `\nCITABLE FACTS:\n${admittedProfile.verifiedFacts.slice(0, 3).map((f) => `- ${f}`).join('\n')}` : ''}
` : ''}
${mentionedFear && mentionedAP ? `
AP Score Reality (if discussing concerns):
- Score of 3: "${AP_SCORE_PERCEPTIONS[3].admissionsPerception}"
- Score of 4: "${AP_SCORE_PERCEPTIONS[4].admissionsPerception}"
` : ''}
${realStakesContext ? `
Real Stakes Statement:
"${realStakesContext}"
` : ''}
${context.assembledResearchContext ? `
## COMPREHENSIVE RESEARCH CONTEXT (Use for deep, expert-level guidance)
${context.assembledResearchContext}
` : ''}

## Relevant Course Knowledge
${
  knowledge?.apCourses?.length
    ? `AP Course data:\n${knowledge.apCourses
        .slice(0, 3)
        .map((c) => `- ${c.name}: ${formatPassRate(c.passRate)} pass rate, ~${c.weeklyHours.typical}hrs/week`)
        .join('\n')}`
    : ''
}
${
  knowledge?.apCourses
    ?.slice(0, 2)
    .flatMap((c) => c.commonFears)
    .slice(0, 2)
    .map((f) => `- Fear: "${f.fear}" → Reality: ${f.reality}`)
    .join('\n') || ''
}

## Your Style for This Response
${styleGuidance}

## CONVERSATION EFFICIENCY (CRITICAL)

**NO FLUFF OPENINGS - Start with substance:**
- NEVER start with "That's exactly what I suspected" or "That confirms what I thought"
- NEVER use "Here's what this means:" as a transition
- Instead, lead with the IMPLICATION of what they said

**WHEN STUDENT CONFIRMS LOW EFFORT, frame the response around:**
- A more challenging course will actually showcase their true capability
- Easy courses that require minimal effort signal "this is your ceiling" to admissions
- The transcript is their proof of capability—they control what it shows
Example: "Operating at 25% effort means your transcript shows 25% of what you can do. A more engaging course like BC would finally let colleges see your actual capability—and you'd likely find it more interesting than repeating patterns you've already mastered."

**AVOID REPETITION - Check what's been covered:**
${context.pointsAlreadyCovered ? `
POINTS ALREADY MADE (DO NOT REPEAT THESE):
- Data points mentioned: ${context.pointsAlreadyCovered.dataPointsMentioned.join(', ') || 'none yet'}
- Arguments made: ${context.pointsAlreadyCovered.argumentsMade.join(', ') || 'none yet'}
- Courses recommended: ${context.pointsAlreadyCovered.courseRecommendations.join(', ') || 'none yet'}
- Concerns addressed: ${context.pointsAlreadyCovered.concernsAddressed.join(', ') || 'none yet'}

ADVANCE THE CONVERSATION by introducing NEW information, not restating old points.
` : ''}

**HIGH-VALUE FACTS TO INTRODUCE (if not yet mentioned):**
- College weighting: "A 3.7 in AP reads stronger than 3.95 in Honors to selective schools"
- CDS rigor rating: "Stanford/Harvard rate rigor as 'very important'—highest rating"
- Course placement: "BC often places into Calc III, skipping a semester"
- Pass rate comparison: "BC's 81% pass rate vs AB's 61% reflects self-selection, not difficulty"

## TONE GUIDELINES
- Focus on WHAT GETS THEM ADMITTED, not personal development
- If they mention self-learning/personal projects, acknowledge this as POSITIVE evidence of interest
- Frame self-learning as COMPLEMENTING formal coursework, not replacement
- Explain why specific courses help admission (course placement, demonstrated rigor, peer expectations)
- Don't lecture—recommend and explain value

## QUALITY REQUIREMENTS
- Every point must be DISTINCT - no rephrasing the same idea multiple ways
- Use the SPECIFIC recommendations from insights above (course names, placement benefits)
- The transcript shows capability level to colleges - they can't see "hidden potential"
- Each sentence should add NEW information, not restate previous sentences

## CITATION GUIDELINES
- When citing statistics, use verified sources:
  * AP pass rates: "College Board 2024 data shows..."
  * Admissions importance: "NACAC research indicates..."
  * College expectations: "Per [College]'s Common Data Set..."
- DO NOT make up percentages like "X% of admits took Y course" - colleges don't publish this
- Use qualitative language for unverifiable claims: "selective colleges generally expect..." rather than fabricated percentages

## FORMAT
100-200 words. Dense with specific facts. No filler sentences.

Generate your response now:`;
}

function getStyleGuidance(style: ConversationStyle): string {
  const guidance: Record<ConversationStyle, string> = {
    curious_explorer: `You're genuinely curious about this student. Ask questions that show you're trying to understand their unique situation, not check boxes. Be warm and non-judgmental. "I'm curious about..." "Help me understand..." "That's interesting - tell me more about..."`,

    strategic_teacher: `You're sharing expert knowledge that will genuinely help this student. Explain things clearly without being condescending. Use specific numbers and facts. Connect abstract advice to their specific situation. "Here's something most people don't realize..." "Let me put some numbers to this..."`,

    honest_mirror: `You're reflecting reality the student may not be seeing. Be direct but compassionate. This isn't about being harsh - it's about helping them see clearly. "I want to be honest with you about something..." "Here's what I'm seeing that concerns me..."`,

    gentle_challenger: `This student has capability that isn't showing on their transcript. Your job: explain WHAT they're missing and WHY it matters for admission. Be specific about courses and their value—not vague "seek challenge" messaging. Cite the specific data from the insights.`,

    empathetic_validator: `The student shared something difficult. FIRST validate their experience before any strategy discussion. Show you understand. Then, and only then, gently shift to "what can we do about this?" "That sounds really hard..." "I can see why that would be frustrating..."`,

    connecting_synthesizer: `You're helping the student see patterns they haven't noticed. Connect dots across different areas of their profile. Build a narrative. "I'm seeing something interesting when I look at all of this together..." "There's a pattern here worth naming..."`,

    practical_advisor: `You're giving concrete, actionable recommendations. Be specific about what to do, when, and why. No vague advice. "Here's what I'd recommend, specifically..." "Next year, you should..." "The priority is..."`,
  };

  return guidance[style];
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function selectStyleForOpening(context: OpeningContext): ConversationStyle {
  // If there's a major mismatch, we might need to be an honest mirror
  const hasMismatch = context.insights.some(
    (i) => i.observation.toLowerCase().includes('mismatch') || i.observation.toLowerCase().includes('elsewhere')
  );

  // If there's untapped potential (low effort + high grades), gentle challenge
  if (context.academicPatterns.effortGapSubjects && context.academicPatterns.effortGapSubjects.length > 0) {
    return 'gentle_challenger';
  }

  // If trajectory is declining, may need to be empathetic
  if (context.student.trajectory === 'descending') {
    return 'empathetic_validator';
  }

  // If major mismatch, honest mirror
  if (hasMismatch) {
    return 'honest_mirror';
  }

  // Default to curious explorer for opening
  return 'curious_explorer';
}

function extractKnowledgeUsed(
  message: string,
  knowledge: ConversationContext['relevantKnowledge']
): string[] {
  const used: string[] = [];

  // Check if any AP courses were mentioned
  knowledge?.apCourses?.forEach((course) => {
    if (message.toLowerCase().includes(course.shortName.toLowerCase())) {
      used.push(`AP Course: ${course.name}`);
    }
  });

  // Check for statistics
  if (message.includes('%')) {
    used.push('Statistics referenced');
  }

  // Check for workload guidance
  if (message.includes('hours') || message.includes('workload')) {
    used.push('Workload guidance');
  }

  return used;
}

function extractStrategyUpdates(message: string): string[] {
  const updates: string[] = [];

  // Look for strategy-related language
  if (message.includes('should') || message.includes('recommend')) {
    updates.push('Recommendations provided');
  }

  if (message.includes("won't") || message.includes("shouldn't") || message.includes('avoid')) {
    updates.push('Cautionary guidance provided');
  }

  return updates;
}

/**
 * Extract points covered in a response to prevent repetition in future turns.
 * Uses LLM-based semantic extraction for intelligent, context-aware point identification.
 * Falls back to basic pattern matching if LLM call fails.
 */
async function extractPointsCoveredAsync(message: string): Promise<GeneratedResponse['pointsCovered']> {
  const prompt = `Analyze this academic advisor message and extract what specific points were communicated.

MESSAGE:
"${message}"

Extract and categorize what was communicated:

1. DATA POINTS MENTIONED - Specific statistics, percentages, or facts cited
   Examples: "BC 81% pass rate", "Stanford CDS rigor rating", "3.7 AP vs 3.95 Honors comparison"

2. ARGUMENTS MADE - Key logical arguments or persuasion points
   Examples: "transcript shows capability not potential", "colleges recalculate GPA", "course placement benefits"

3. COURSE RECOMMENDATIONS - Specific courses suggested or discussed
   Examples: "AP Calculus BC", "AP Physics C", "AP Computer Science A"

4. CONCERNS ADDRESSED - Student fears or worries that were directly addressed
   Examples: "GPA protection fear", "difficulty concern", "workload anxiety"

Respond in this EXACT JSON format (include only items that were ACTUALLY mentioned):
{
  "dataPointsMentioned": ["point1", "point2"],
  "argumentsMade": ["arg1", "arg2"],
  "courseRecommendations": ["course1"],
  "concernsAddressed": ["concern1"]
}

Be specific and concise. Use short descriptive labels. Only include points that were EXPLICITLY made in the message.`;

  try {
    console.log('[NaturalResponseGenerator] Extracting points with LLM...');
    const response = await callClaude<string>({
      model: MODELS.haiku, // Fast model for extraction
      maxTokens: 500,
      messages: [{ role: 'user', content: prompt }],
    });

    const content = response.content || '';

    // Parse JSON from response
    const jsonMatch = content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      console.log('[NaturalResponseGenerator] LLM extraction successful:', parsed);
      return {
        dataPointsMentioned: parsed.dataPointsMentioned || [],
        argumentsMade: parsed.argumentsMade || [],
        courseRecommendations: parsed.courseRecommendations || [],
        concernsAddressed: parsed.concernsAddressed || [],
      };
    }

    throw new Error('Could not parse JSON from LLM response');
  } catch (error) {
    console.warn('[NaturalResponseGenerator] LLM extraction failed, using fallback:', error);
    return extractPointsCoveredFallback(message);
  }
}

/**
 * Synchronous wrapper that returns empty points (for non-critical paths)
 * Use extractPointsCoveredAsync for accurate extraction.
 */
function extractPointsCovered(message: string): GeneratedResponse['pointsCovered'] {
  // Return basic fallback synchronously - the async version should be used for accuracy
  return extractPointsCoveredFallback(message);
}

/**
 * Basic pattern matching fallback when LLM extraction fails.
 * Less accurate but ensures system resilience.
 */
function extractPointsCoveredFallback(message: string): GeneratedResponse['pointsCovered'] {
  const messageLower = message.toLowerCase();

  const dataPointsMentioned: string[] = [];
  const argumentsMade: string[] = [];
  const courseRecommendations: string[] = [];
  const concernsAddressed: string[] = [];

  // Data points - statistics and facts
  if (messageLower.includes('81%') || messageLower.includes('81 percent')) {
    dataPointsMentioned.push('BC 81% pass rate');
  }
  if (messageLower.includes('61%') || messageLower.includes('61 percent')) {
    dataPointsMentioned.push('AB 61% pass rate');
  }
  if (messageLower.includes('64%') || (messageLower.includes('rigor') && messageLower.includes('important'))) {
    dataPointsMentioned.push('NACAC rigor importance');
  }
  if (messageLower.includes('very important') && (messageLower.includes('stanford') || messageLower.includes('harvard') || messageLower.includes('common data'))) {
    dataPointsMentioned.push('CDS rigor rating');
  }
  if (messageLower.includes('3.7') && messageLower.includes('3.95')) {
    dataPointsMentioned.push('AP vs Honors GPA comparison');
  }

  // Arguments made
  if (messageLower.includes('transcript') && (messageLower.includes('capability') || messageLower.includes('shows'))) {
    argumentsMade.push('transcript shows capability');
  }
  if (messageLower.includes('can\'t see') && (messageLower.includes('effort') || messageLower.includes('potential'))) {
    argumentsMade.push('AOs cant see hidden potential');
  }
  if (messageLower.includes('calc iii') || messageLower.includes('placement')) {
    argumentsMade.push('course placement benefits');
  }
  if (messageLower.includes('self-selection') || (messageLower.includes('higher') && messageLower.includes('pass rate'))) {
    argumentsMade.push('BC higher pass rate explanation');
  }
  if (messageLower.includes('weighting') || messageLower.includes('recalculate')) {
    argumentsMade.push('college GPA weighting');
  }

  // Course recommendations
  if (messageLower.includes('bc') && (messageLower.includes('take') || messageLower.includes('recommend') || messageLower.includes('should'))) {
    courseRecommendations.push('AP Calculus BC');
  }
  if (messageLower.includes('physics c') && (messageLower.includes('take') || messageLower.includes('recommend') || messageLower.includes('should'))) {
    courseRecommendations.push('AP Physics C');
  }
  if (messageLower.includes('cs a') || (messageLower.includes('computer science a') && (messageLower.includes('take') || messageLower.includes('recommend')))) {
    courseRecommendations.push('AP Computer Science A');
  }

  // Concerns addressed
  if (messageLower.includes('scared') || messageLower.includes('fear') || messageLower.includes('worried')) {
    if (messageLower.includes('gpa') || messageLower.includes('grade')) {
      concernsAddressed.push('GPA protection fear');
    }
    if (messageLower.includes('hard') || messageLower.includes('difficult')) {
      concernsAddressed.push('difficulty fear');
    }
  }
  if (messageLower.includes('effort') && (messageLower.includes('low') || messageLower.includes('minimal') || messageLower.includes('25%'))) {
    concernsAddressed.push('effort gap identified');
  }

  return {
    dataPointsMentioned,
    argumentsMade,
    courseRecommendations,
    concernsAddressed,
  };
}

function generateFallbackOpening(context: OpeningContext, style: ConversationStyle): GeneratedResponse {
  // Simple fallback that still personalizes
  const topInsight = context.insights[0];
  const question = context.topPriorityQuestion;

  let message = `I've been looking at your academic record, and there's something I want to explore with you.`;

  if (topInsight) {
    message += `\n\n${topInsight.observation}. ${topInsight.interpretation}`;
  }

  message += `\n\n${question.question}`;

  if (question.purpose) {
    message += ` (${question.purpose.toLowerCase()})`;
  }

  return {
    message,
    style,
    knowledgeUsed: [],
    nextQuestionPurpose: question.purpose,
  };
}

function generateFallbackResponse(context: ConversationContext, style: ConversationStyle): GeneratedResponse {
  const response = context.currentExchange.theirResponse || '';

  let message = `I hear you. `;

  if (context.currentExchange.emotionalTone === 'anxious' || context.currentExchange.emotionalTone === 'negative') {
    message = `That sounds challenging. I appreciate you sharing that. `;
  }

  if (context.informationGaps.length > 0) {
    message += `\n\nI'm still curious about ${context.informationGaps[0].toLowerCase()}.`;
  }

  return {
    message,
    style,
    knowledgeUsed: [],
    strategyUpdates: [],
  };
}

// ============================================================================
// SPECIALIZED RESPONSE GENERATORS
// ============================================================================

/**
 * Generate a teaching moment about a specific AP course
 */
export async function generateAPCourseTeaching(
  courseName: string,
  studentContext: {
    grade: number;
    currentLevel: string;
    subjectGPA: number;
    effort?: number;
    fear?: string;
  }
): Promise<string> {
  const course = getAPCourse(courseName);
  if (!course) {
    return `I'm not sure about the specifics of ${courseName}, but let's talk about what you're looking for.`;
  }

  const prompt = `You are an expert academic advisor explaining ${course.name} to a student.

Student Context:
- Grade: ${studentContext.grade}
- Current Level: ${studentContext.currentLevel}
- GPA in this subject: ${studentContext.subjectGPA}
${studentContext.effort !== undefined ? `- Effort Level: ${studentContext.effort}%` : ''}
${studentContext.fear ? `- Their Concern: "${studentContext.fear}"` : ''}

Course Facts:
- Pass Rate: ${formatPassRate(course.passRate)} (Score 3+)
- 5 Rate: ${formatPassRate(course.fiveRate)}
- Weekly Hours: ${course.weeklyHours.minimum}-${course.weeklyHours.intensive}
- Difficulty: ${course.perceivedDifficulty}

What Makes It Challenging:
${course.challengeFactors.map((f) => `- ${f}`).join('\n')}

How Students Succeed:
${course.successStrategies.slice(0, 3).map((s) => `- ${s}`).join('\n')}

${
  studentContext.fear
    ? `
Relevant Fear to Address:
${course.commonFears.find((f) => f.fear.toLowerCase().includes(studentContext.fear?.toLowerCase() || '')) || course.commonFears[0]}
`
    : ''
}

Write a 100-150 word response that:
1. Addresses their specific situation and any concerns
2. Uses real statistics to provide context
3. Explains what makes the course challenging AND how to succeed
4. Is honest about difficulty but encouraging about their capability
5. Sounds like an expert friend, not a brochure

DO NOT use bullet points or headers. Write natural prose.`;

  try {
    console.log('[NaturalResponseGenerator] Making LLM call for AP course teaching...');
    const response = await callClaude<string>({
      model: MODELS.haiku,
      maxTokens: 400,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content || '';
    if (!message) {
      throw new Error('Empty response from LLM');
    }
    console.log('[NaturalResponseGenerator] AP course teaching successful');
    return message;
  } catch (error) {
    console.error('[NaturalResponseGenerator] AP course teaching failed:', error);
    throw new Error(`LLM call failed for AP teaching: ${error instanceof Error ? error.message : String(error)}`);
  }
}

/**
 * Generate workload analysis for a proposed course combination
 */
export async function generateWorkloadAnalysis(
  proposedCourses: string[],
  studentContext: {
    grade: number;
    schoolType: string;
    currentEffortLevel: number;
    currentRigorousCourses: number;
  }
): Promise<string> {
  const loadGuidance = getLoadGuidance(studentContext.grade as 9 | 10 | 11 | 12, studentContext.schoolType);
  const courseProfiles = proposedCourses.map((c) => getAPCourse(c)).filter(Boolean) as APCourseProfile[];

  const totalHours = courseProfiles.reduce((sum, c) => sum + c.weeklyHours.typical, 0);
  const hardCourses = courseProfiles.filter((c) => c.difficultyTier >= 4);

  const prompt = `You are analyzing a student's proposed course load.

Student:
- Grade ${studentContext.grade}
- School Type: ${studentContext.schoolType}
- Current Effort: ${studentContext.currentEffortLevel}%
- Current Rigorous Courses: ${studentContext.currentRigorousCourses}

Proposed Courses:
${courseProfiles.map((c) => `- ${c.name}: ${c.weeklyHours.typical}hrs/week, difficulty tier ${c.difficultyTier}/5`).join('\n')}

Analysis:
- Total estimated weekly hours: ${totalHours}
- Number of high-difficulty courses (tier 4-5): ${hardCourses.length}
${loadGuidance ? `- Typical for this grade/school: ${loadGuidance.rigorousCourses.typical} rigorous courses` : ''}

Write 80-120 words giving your honest assessment:
1. Is this sustainable?
2. What's the risk?
3. What would make this work?

Be direct and specific. No bullet points.`;

  try {
    console.log('[NaturalResponseGenerator] Making LLM call for workload analysis...');
    const response = await callClaude<string>({
      model: MODELS.haiku,
      maxTokens: 300,
      messages: [{ role: 'user', content: prompt }],
    });

    const message = response.content || '';
    if (!message) {
      throw new Error('Empty response from LLM');
    }
    console.log('[NaturalResponseGenerator] Workload analysis successful');
    return message;
  } catch (error) {
    console.error('[NaturalResponseGenerator] Workload analysis failed:', error);
    throw new Error(`LLM call failed for workload: ${error instanceof Error ? error.message : String(error)}`);
  }
}
