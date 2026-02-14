// @ts-nocheck
/**
 * Cliché Issue Integration Service
 *
 * Bridges the SemanticClicheAnalyzer output to the CriticalIssue format
 * used by the main workshop pipeline (Stage 1B → Stage 2 → Suggestions).
 *
 * **Integration Points**:
 * 1. Converts cliché analysis → CriticalIssue format
 * 2. Adds cliché-specific symptom types
 * 3. Generates cliché-specific missing_elements
 * 4. Creates targeted Socratic questions
 * 5. Maps to college values impacted
 *
 * **Cost**: Free (uses existing SemanticClicheAnalyzer output)
 */

import type { CriticalIssue } from './stage1BDiagnosisService';
import type {
  SemanticClicheAnalysis,
  LanguageCliche,
  TellingNotShowing,
  TopicClicheAssessment,
  NarrativeArcClicheAssessment,
} from './semanticClicheAnalyzer';
import {
  generateDeepPrescription,
  generateAllDeepPrescriptions,
  type DeepPrescription,
} from './deepPrescriptionGenerator';

// ============================================================================
// EXPANDED CLICHÉ SYMPTOM TYPES
// ============================================================================

/**
 * Extended symptom types for cliché detection
 * These extend the base 8 symptom types in IssueSymptomDiagnosis
 */
export type ClicheSymptomType =
  // Existing symptom type (already in system)
  | 'cliche_metaphor'
  | 'telling_not_showing'
  // New cliché-specific types
  | 'cliche_topic_framing'      // Common topic with cliché approach
  | 'cliche_narrative_arc'      // Predictable redemption/discovery arc
  | 'cliche_ai_convergence'     // AI-generated sounding language
  | 'cliche_essay_formula'      // "Ever since I was a child", "Little did I know"
  | 'cliche_college_specific'   // Using college's own terminology back at them
  | 'cliche_value_signaling'    // "I'm passionate about", "I love learning"
  | 'cliche_inspirational'      // "Hard work pays off", "Never give up"
  ;

/**
 * Cliché issue severity (maps to existing severity scale)
 */
export type ClicheSeverity = 'critical' | 'major' | 'minor';

// ============================================================================
// CLICHÉ TO CRITICAL ISSUE CONVERSION
// ============================================================================

/**
 * Extract narrative scenes/moments from essay text for essay-specific feedback
 */
function extractNarrativeScenes(essayText: string): {
  timeReferences: string[];
  settingDetails: string[];
  actionMoments: string[];
  dialogueSnippets: string[];
} {
  const result = {
    timeReferences: [] as string[],
    settingDetails: [] as string[],
    actionMoments: [] as string[],
    dialogueSnippets: [] as string[],
  };

  // Extract time references (2 AM, 14 hours, last week, that morning)
  const timeMatches = essayText.match(/(?:\d+(?::\d+)?\s*(?:AM|PM|am|pm)|(?:at|around|by)\s+\d+(?::\d+)?|\d+\s+hours?\s*(?:straight|later|before|after)?|(?:that|this|last|one)\s+(?:morning|night|evening|afternoon|week|day|moment))/gi);
  if (timeMatches) {
    result.timeReferences = [...new Set(timeMatches.map(m => m.trim()))].slice(0, 3);
  }

  // Extract setting details (in my room, at the table, on the field)
  const settingMatches = essayText.match(/(?:in (?:my|the|our)\s+\w+|at (?:my|the|our)\s+\w+|on (?:my|the|our)\s+\w+)/gi);
  if (settingMatches) {
    result.settingDetails = [...new Set(settingMatches.map(m => m.trim()))].slice(0, 3);
  }

  // Extract action moments (I watched, I stared, I found, I typed)
  const actionMatches = essayText.match(/I\s+(?:watched|stared|found|typed|clicked|scrolled|ran|jumped|walked|sat|stood|looked|reached|grabbed|dropped|forgot|remembered|realized|noticed)/gi);
  if (actionMatches) {
    result.actionMoments = [...new Set(actionMatches.map(m => m.trim()))].slice(0, 3);
  }

  // Extract quoted dialogue if present
  const dialogueMatches = essayText.match(/"[^"]{5,60}"/g);
  if (dialogueMatches) {
    result.dialogueSnippets = dialogueMatches.slice(0, 2);
  }

  return result;
}

/**
 * Generate essay-specific micro_moment prompt by referencing actual essay content
 */
function generateEssaySpecificMicroMoment(
  essayText: string | undefined,
  scenes: ReturnType<typeof extractNarrativeScenes>,
  fallbackPrompt: string
): string {
  if (!essayText) return fallbackPrompt;

  // If we found time references, reference them specifically
  if (scenes.timeReferences.length > 0) {
    const timeRef = scenes.timeReferences[0];
    return `Expand on the "${timeRef}" moment—what exactly were you doing? What did you see, hear, think? Make us feel like we're there.`;
  }

  // If we found action moments, reference them
  if (scenes.actionMoments.length > 0) {
    const action = scenes.actionMoments[0];
    return `Take us deeper into the moment when "${action}"—slow down time. What was happening in your body? What detail would only you notice?`;
  }

  // If we found settings, use them
  if (scenes.settingDetails.length > 0) {
    const setting = scenes.settingDetails[0];
    return `You mention "${setting}"—describe it so vividly we can see it. What's out of place? What's worn out from your use?`;
  }

  return fallbackPrompt;
}

/**
 * Convert SemanticClicheAnalysis to CriticalIssue[]
 *
 * This is the main integration function that takes the rich cliché analysis
 * and converts it to the CriticalIssue format the workshop pipeline expects.
 *
 * @param analysis - Output from semanticClicheAnalyzer.analyze()
 * @param collegeId - Optional college ID for college-specific context
 * @param essayText - Original essay text for context extraction
 * @returns Array of CriticalIssue objects ready for Stage 2
 */
export function convertClicheAnalysisToCriticalIssues(
  analysis: SemanticClicheAnalysis,
  collegeId?: string,
  essayText?: string
): CriticalIssue[] {
  const issues: CriticalIssue[] = [];
  let issueNumber = 1;

  // Extract narrative scenes for essay-specific feedback
  const scenes = essayText ? extractNarrativeScenes(essayText) : {
    timeReferences: [],
    settingDetails: [],
    actionMoments: [],
    dialogueSnippets: [],
  };

  // Priority 1: Topic/Framing cliché (if detected)
  if (analysis.topic_assessment.is_cliche_framing && analysis.topic_assessment.topic) {
    issues.push(createTopicFramingIssue(
      analysis.topic_assessment,
      analysis.narrative_arc,
      issueNumber++,
      collegeId,
      essayText,
      scenes
    ));
  }

  // Priority 2: Narrative arc cliché (if highly predictable)
  if (analysis.narrative_arc.predictability_score >= 7) {
    issues.push(createNarrativeArcIssue(
      analysis.narrative_arc,
      issueNumber++,
      collegeId,
      essayText,
      scenes
    ));
  }

  // Priority 3: Most egregious language clichés (limit to top 2)
  const criticalCliches = analysis.language_cliches
    .filter(c => c.type === 'ai_convergence' || c.type === 'essay_cliche' || c.type === 'college_specific')
    .slice(0, 2);

  for (const cliche of criticalCliches) {
    issues.push(createLanguageClicheIssue(
      cliche,
      issueNumber++,
      collegeId,
      essayText,
      scenes
    ));
  }

  // Priority 4: Telling-not-showing violations (limit to top 2)
  const tellingViolations = analysis.telling_not_showing.slice(0, 2);
  for (const telling of tellingViolations) {
    issues.push(createTellingIssue(
      telling,
      issueNumber++,
      analysis.strongest_unique_element,
      collegeId,
      essayText,
      scenes
    ));
  }

  // Cap at 3 issues maximum (to match Stage 1B output)
  return issues.slice(0, 3);
}

// ============================================================================
// ISSUE CREATION FUNCTIONS
// ============================================================================

/**
 * Create issue for clichéd topic framing
 */
export function createTopicFramingIssue(
  topicAssessment: TopicClicheAssessment,
  arcAssessment: NarrativeArcClicheAssessment,
  issueNumber: number,
  collegeId?: string,
  essayText?: string,
  scenes?: ReturnType<typeof extractNarrativeScenes>
): CriticalIssue {
  const topic = topicAssessment.topic || 'common topic';
  const topicGuidance = getTopicSpecificGuidance(topic);

  // Generate essay-specific micro_moment if we have essay context
  const microMoment = topicAssessment.unique_angle_detected
    ? `Build on this unique element you already have: "${topicAssessment.unique_angle_detected}" - expand it into a full scene`
    : scenes
      ? generateEssaySpecificMicroMoment(essayText, scenes, topicGuidance.microMoment)
      : topicGuidance.microMoment;

  return {
    issue_number: issueNumber,
    quote: `[Essay uses ${topic} topic with ${topicAssessment.framing_assessment} framing]`,
    location: 'Overall essay framing',
    problem: `This essay approaches "${topic}" in a way admissions officers have seen thousands of times. The topic itself isn't the problem—the FRAMING is clichéd.`,
    symptom_type: 'cliche_topic_framing',
    diagnosis: `The essay follows the predictable "${arcAssessment.detected_arc}" arc without finding a unique angle or fresh perspective.`,
    prescription: topicAssessment.freshness_opportunity || topicGuidance.prescription,

    missing_elements: {
      sensory_details: topicGuidance.sensoryDetails,
      concrete_objects: topicGuidance.concreteObjects,
      micro_moment: microMoment,
      emotional_truth: topicGuidance.emotionalTruth,
    },

    relevant_concept: 'Fresh framing over common topics',
    relevant_evidence: [],
    socratic_questions: topicGuidance.socraticQuestions,
    college_value_impacted: collegeId === 'stanford'
      ? 'intellectual_vitality (Stanford wants to see YOUR unique perspective)'
      : 'authentic_voice',
  };
}

/**
 * Generate topic-specific actionable guidance
 */
function getTopicSpecificGuidance(topic: string): {
  prescription: string;
  sensoryDetails: string[];
  concreteObjects: string[];
  microMoment: string;
  emotionalTruth: string;
  socraticQuestions: string[];
} {
  // Normalize topic for matching
  const normalizedTopic = topic.toLowerCase();

  if (normalizedTopic.includes('stanford') || normalizedTopic.includes('why')) {
    return {
      prescription: 'DELETE every sentence that mentions Stanford by name. Now: what SPECIFIC problem are you working on that Stanford resources could help with? Name a professor, paper, or lab.',
      sensoryDetails: [
        'What does your current workspace look like when you\'re working on this problem?',
        'What specific frustration have you hit that made you want better resources/mentors?',
      ],
      concreteObjects: [
        'Name ONE professor whose work you\'ve actually read. What confused you about it?',
        'What specific class, lab, or program would you apply to? Why THAT one?',
        'What\'s the exact version number of the software/tool you\'re limited by?',
      ],
      microMoment: 'Describe the last time you hit a wall and thought "I need access to better X." What were you trying to do? What time was it?',
      emotionalTruth: 'What are you AFRAID of about going to a place like Stanford? Imposter syndrome is more honest than confidence.',
      socraticQuestions: [
        'If Stanford\'s website didn\'t exist, how would you explain what you want to do there?',
        'What have you already TRIED to do that Stanford could help you do better?',
        'Name one weird question you have that you think a Stanford professor could help answer.',
      ],
    };
  }

  if (normalizedTopic.includes('immigra') || normalizedTopic.includes('cultural')) {
    return {
      prescription: 'Find the SMALLEST sensory detail that captures your bicultural experience. Not "I struggled" but "the sound of American rain is wrong."',
      sensoryDetails: [
        'What SOUND in America still sounds wrong to you? (doorbell, siren, rain)',
        'What FOOD do you eat differently than Americans around you?',
        'What physical habit reveals where you\'re from? (how you greet, stand, gesture)',
      ],
      concreteObjects: [
        'What object from your home country do you still have? Where do you keep it?',
        'What American object still feels foreign in your hands?',
        'What do you have TWO of (one from each culture)?',
      ],
      microMoment: 'Find the moment you code-switched this week. What triggered it? What did you say differently?',
      emotionalTruth: 'What part of your original culture are you embarrassed by? What American thing do you secretly love but feel guilty about?',
      socraticQuestions: [
        'What would your grandparents think of how you live now? Be honest—good and bad.',
        'When do you feel most "from" your home country? When do you feel most American?',
        'What thing do you do in private that you\'d never do in front of American friends?',
      ],
    };
  }

  if (normalizedTopic.includes('sport') || normalizedTopic.includes('athlet') || normalizedTopic.includes('team')) {
    return {
      prescription: 'Delete every mention of "teamwork," "perseverance," and "hard work." Start with a specific moment of FAILURE or doubt.',
      sensoryDetails: [
        'What does your sport SMELL like? (chalk, sweat, grass, chlorine)',
        'What sound tells you practice is about to get hard?',
        'What part of your body hurts most right now from this sport?',
      ],
      concreteObjects: [
        'What piece of equipment is worn out because of how specifically YOU use it?',
        'What number (reps, times, miles) would make a teammate say "that\'s so you"?',
        'What object in your bag has a story only you know?',
      ],
      microMoment: 'Describe the moment between the whistle and your reaction. What happens in your body? What do you think about?',
      emotionalTruth: 'When have you wanted to quit? What made you stay—and be honest, not inspiring.',
      socraticQuestions: [
        'What do you HATE about this sport that you keep doing anyway?',
        'What moment made you feel like a fraud or not good enough?',
        'What would your coach say is your biggest weakness? Are they right?',
      ],
    };
  }

  // Default for other topics
  return {
    prescription: 'Find the moment that ALMOST didn\'t make it into your essay because it felt too small, weird, or embarrassing. Start there.',
    sensoryDetails: [
      'What does this experience look/sound/smell like that only someone who lived it would know?',
      'What unexpected sensory detail do you remember most vividly?',
    ],
    concreteObjects: [
      'What specific object captures something true about this experience?',
      'What number or statistic would surprise someone who hasn\'t lived this?',
    ],
    microMoment: 'Find the scene you almost didn\'t include. That\'s probably where the real essay is.',
    emotionalTruth: 'What part of this experience are you embarrassed by? What would you normally hide?',
    socraticQuestions: [
      'What would a skeptic say about this topic? How would you prove them wrong with specifics?',
      'What part of this story do you skip when you tell it in person?',
      'What would someone who was there add that you left out?',
    ],
  };
}

/**
 * Create issue for predictable narrative arc
 */
export function createNarrativeArcIssue(
  arcAssessment: NarrativeArcClicheAssessment,
  issueNumber: number,
  collegeId?: string,
  essayText?: string,
  scenes?: ReturnType<typeof extractNarrativeScenes>
): CriticalIssue {
  // Generate arc-specific actionable guidance
  const arcSpecificGuidance = getArcSpecificGuidance(arcAssessment.arc_type);

  // Generate essay-specific micro_moment if we have essay context
  const microMoment = scenes
    ? generateEssaySpecificMicroMoment(essayText, scenes, arcSpecificGuidance.microMoment)
    : arcSpecificGuidance.microMoment;

  // Generate essay-specific Socratic questions
  const socraticQuestions = [...arcSpecificGuidance.socraticQuestions];
  if (scenes && scenes.timeReferences.length > 0) {
    socraticQuestions.unshift(
      `You mention "${scenes.timeReferences[0]}"—what were you thinking RIGHT BEFORE that moment? What almost happened instead?`
    );
  }

  return {
    issue_number: issueNumber,
    quote: `[Essay follows "${arcAssessment.arc_type}" arc: ${arcAssessment.detected_arc}]`,
    location: 'Narrative structure',
    problem: `This essay follows a ${arcAssessment.predictability_score}/10 predictability arc that admissions officers can see coming from the first paragraph.`,
    symptom_type: 'cliche_narrative_arc',
    diagnosis: arcAssessment.arc_critique,
    prescription: arcAssessment.suggested_subversion || arcSpecificGuidance.prescription,

    missing_elements: {
      sensory_details: arcSpecificGuidance.sensoryDetails,
      concrete_objects: arcSpecificGuidance.concreteObjects,
      micro_moment: microMoment,
      emotional_truth: arcSpecificGuidance.emotionalTruth,
    },

    relevant_concept: 'Subverting expected narrative arcs',
    relevant_evidence: [],
    socratic_questions: socraticQuestions.slice(0, 3),
    college_value_impacted: collegeId === 'stanford'
      ? 'authentic_voice (Stanford wants genuine complexity, not neat lessons)'
      : 'narrative_authenticity',
  };
}

/**
 * Generate arc-specific actionable guidance
 */
function getArcSpecificGuidance(arcType: string): {
  prescription: string;
  sensoryDetails: string[];
  concreteObjects: string[];
  microMoment: string;
  emotionalTruth: string;
  socraticQuestions: string[];
} {
  switch (arcType) {
    case 'passion_origin':
      return {
        prescription: 'DELETE your first paragraph. Start in the MIDDLE of a specific problem you were solving. What time was it? What exactly was on your screen?',
        sensoryDetails: [
          'What does your workspace look like at 2AM when you\'re deep in this passion? (coffee cups, sticky notes, specific books)',
          'What sounds do you hear when you\'re in flow? (keyboard clicks, music, silence)',
        ],
        concreteObjects: [
          'Name the exact tool/software/book you use most',
          'What object on your desk represents a failure you learned from?',
          'What\'s the weirdest thing you\'ve googled while pursuing this?',
        ],
        microMoment: 'Write the scene where you almost quit. What time was it? What broke? Who wasn\'t there to help?',
        emotionalTruth: 'What do you HATE about this thing you love? What part is boring but you do it anyway?',
        socraticQuestions: [
          'What\'s the ugliest, most frustrating part of this passion that you never mention?',
          'When was the last time this passion made you feel stupid or inadequate?',
          'If you had to explain why you keep doing this despite the frustration, what would you say?',
        ],
      };

    case 'overcoming':
    case 'redemption':
      return {
        prescription: 'Don\'t start with the problem. Start with a MUNDANE moment AFTER you supposedly "overcame" it. Show how the struggle is still present.',
        sensoryDetails: [
          'What does your body still do differently because of this experience? (flinch, check, avoid)',
          'What sound or smell still triggers the memory of the hard time?',
        ],
        concreteObjects: [
          'What object from that time do you still have? Where is it now?',
          'What did you throw away or lose during that period?',
        ],
        microMoment: 'Describe a moment in the LAST WEEK when this "overcome" struggle showed up again. The growth isn\'t complete—show that.',
        emotionalTruth: 'What are you still angry about? What haven\'t you forgiven? Neat lessons don\'t ring true.',
        socraticQuestions: [
          'How does this struggle still affect you TODAY—not in the past, but right now?',
          'What would you tell someone who said "you\'ve totally moved on from that"?',
          'What part of this story do you skip when telling it to make yourself look better?',
        ],
      };

    case 'discovery':
    case 'realization':
      return {
        prescription: 'Cut the "I realized" sentence entirely. Show the BEFORE and AFTER through specific behavior changes, not proclaimed insights.',
        sensoryDetails: [
          'What did you DO differently the day after this realization? (walked faster, called someone, avoided something)',
          'What did your room/desk/phone look like before vs after?',
        ],
        concreteObjects: [
          'What object did you start using that you didn\'t before?',
          'What app/book/tool did you delete or stop using?',
        ],
        microMoment: 'Show me the moment BEFORE the realization—when you were still wrong. Make the reader understand your old thinking.',
        emotionalTruth: 'What are you embarrassed about from your "before" state? What would old-you think of current-you?',
        socraticQuestions: [
          'If a camera was following you, what would it capture you doing differently now?',
          'What habit did you have before that you\'re ashamed of now?',
          'Who saw you BEFORE the change and how do they treat you differently now?',
        ],
      };

    default:
      return {
        prescription: 'Find the moment where things DIDN\'T go as expected—that\'s where the real story is. Start there.',
        sensoryDetails: [
          'What surprised you about this experience that you never mention?',
          'What sensory detail do you remember most vividly? Why that one?',
        ],
        concreteObjects: [
          'What object from this experience do you still think about?',
          'What number or statistic captures something real about this?',
        ],
        microMoment: 'Find the moment you almost didn\'t include because it felt too small or weird. That\'s probably the real story.',
        emotionalTruth: 'What messy, contradictory, or unexpected feeling haven\'t you shown?',
        socraticQuestions: [
          'Where in this story did things NOT go as expected?',
          'What\'s the part of this experience you usually leave out when telling it?',
          'What would someone who was there with you add that you didn\'t include?',
        ],
      };
  }
}

/**
 * Create issue for language-level cliché
 */
export function createLanguageClicheIssue(
  cliche: LanguageCliche,
  issueNumber: number,
  collegeId?: string,
  essayText?: string,
  scenes?: ReturnType<typeof extractNarrativeScenes>
): CriticalIssue {
  const symptomType = mapClicheTypeToSymptom(cliche.type);
  const severity = getClicheSeverity(cliche.type);
  const clicheGuidance = getLanguageClicheGuidance(cliche.phrase, cliche.type);

  // Generate essay-specific micro_moment if we have essay context
  const microMoment = scenes
    ? generateEssaySpecificMicroMoment(essayText, scenes, clicheGuidance.microMoment)
    : clicheGuidance.microMoment;

  // Generate essay-specific Socratic questions by referencing actual essay content
  const socraticQuestions = [...clicheGuidance.socraticQuestions];
  if (scenes && scenes.actionMoments.length > 0) {
    // Replace a generic question with an essay-specific one
    socraticQuestions[0] = `You wrote "${scenes.actionMoments[0]}"—what was in your head at that exact second? Start there instead of "${cliche.phrase}".`;
  }

  return {
    issue_number: issueNumber,
    quote: cliche.phrase,
    location: 'Language',
    problem: cliche.why_cliche,
    symptom_type: symptomType,
    diagnosis: `"${cliche.phrase}" is a ${cliche.type.replace('_', ' ')} pattern that makes your essay sound ${
      cliche.type === 'ai_convergence' ? 'AI-generated' :
      cliche.type === 'college_specific' ? 'like you copied the admissions website' :
      'like every other applicant'
    }.`,
    prescription: cliche.alternative_approach || clicheGuidance.prescription,

    missing_elements: {
      sensory_details: clicheGuidance.sensoryDetails,
      concrete_objects: clicheGuidance.concreteObjects,
      micro_moment: microMoment,
      emotional_truth: clicheGuidance.emotionalTruth,
    },

    relevant_concept: 'Specific language over generic claims',
    relevant_evidence: [],
    socratic_questions: socraticQuestions.slice(0, 3),
    college_value_impacted: severity === 'critical'
      ? 'authentic_voice (critical: this phrase immediately signals inauthenticity)'
      : 'authentic_voice',
  };
}

/**
 * Generate phrase-specific guidance for language clichés
 */
function getLanguageClicheGuidance(phrase: string, type: string): {
  prescription: string;
  sensoryDetails: string[];
  concreteObjects: string[];
  microMoment: string;
  emotionalTruth: string;
  socraticQuestions: string[];
} {
  const lowerPhrase = phrase.toLowerCase();

  // Essay opening clichés
  if (lowerPhrase.includes('ever since') || lowerPhrase.includes('since i was')) {
    return {
      prescription: 'DELETE this sentence entirely. Start with a specific scene instead: what were you DOING when this passion became visible?',
      sensoryDetails: [
        'What did the room look like when you first did this thing you love?',
        'What sound do you associate with early memories of this interest?',
      ],
      concreteObjects: [
        'What was the first book/tool/game related to this interest?',
        'What object from childhood still connects to this passion?',
        'What was your age and grade when something specific happened?',
      ],
      microMoment: 'Pick ONE childhood memory. Describe it in 30 words: where were you, what were you touching, who else was there?',
      emotionalTruth: 'What did you NOT understand about this passion as a child that you understand now?',
      socraticQuestions: [
        'What would a home video of young-you show? Describe what we\'d SEE.',
        'What childhood memory proves this passion, without you having to say "I was passionate"?',
        'What did childhood-you get WRONG about this that makes you smile now?',
      ],
    };
  }

  // "Passion" and "love" clichés
  if (lowerPhrase.includes('passion') || lowerPhrase.includes('love') || lowerPhrase.includes('fascinated')) {
    return {
      prescription: 'DELETE every sentence with "passion/love/fascinated." Replace with: What do you DO at 2AM that proves this interest?',
      sensoryDetails: [
        'What does your obsession look like when no one is watching?',
        'What physical habit do you have because of this interest? (worn books, calluses, bookmarks)',
      ],
      concreteObjects: [
        'How many hours/attempts/versions have you put into this? Give a real number.',
        'What weird thing have you bought or made because of this interest?',
        'What\'s the most embarrassing evidence of how much you care?',
      ],
      microMoment: 'Describe the last time you lost track of time doing this. What were you working on? What did you skip to keep doing it?',
      emotionalTruth: 'What makes you angry or frustrated about this thing you love? That\'s more honest than "passion."',
      socraticQuestions: [
        'If someone doubted you cared about this, what EVIDENCE would you show them?',
        'What have you sacrificed for this that wasn\'t worth it?',
        'What would you still be doing related to this if no one ever found out?',
      ],
    };
  }

  // College-specific clichés
  if (type === 'college_specific') {
    return {
      prescription: 'DELETE this phrase. Ask yourself: if the school\'s website didn\'t exist, what would you say?',
      sensoryDetails: [
        'What specific problem are you working on that this school\'s resources could help with?',
        'What does your current limitation look/feel like in practice?',
      ],
      concreteObjects: [
        'Name ONE professor whose work you\'ve read. Quote one sentence that confused or excited you.',
        'What specific course/lab/program would you apply to? What about it matches your work?',
        'What have you built/done that shows you\'re ready for these resources?',
      ],
      microMoment: 'Describe the moment you realized you needed something this school has. What were you trying to do? What went wrong?',
      emotionalTruth: 'What scares you about actually getting into this place? Imposter syndrome is more honest than confidence.',
      socraticQuestions: [
        'If you got rejected from this school, what would you still be able to learn or do?',
        'What question do you have that you think someone at this school could help answer?',
        'What have you already TRIED that made you want these specific resources?',
      ],
    };
  }

  // AI convergence patterns
  if (type === 'ai_convergence') {
    return {
      prescription: 'DELETE this word/phrase. Replace with plain language that a friend would use: "My trip taught me" instead of "This transformative journey instilled."',
      sensoryDetails: [
        'What actually happened? Describe it like you\'re telling a friend, not writing an essay.',
        'What would a video show? Describe that instead of using abstract words.',
      ],
      concreteObjects: [
        'Replace abstract nouns (journey, experience, growth) with specific events',
        'What actually changed? Name a behavior, not a quality.',
      ],
      microMoment: 'Tell this story to an imaginary friend in 20 words. Now write THAT version.',
      emotionalTruth: 'Are you using fancy words because you\'re not sure what to say? That\'s okay—but figure out what you mean first.',
      socraticQuestions: [
        'Would you ever say this phrase out loud to a friend? If not, why are you writing it?',
        'What are you actually trying to communicate? Say it simply.',
        'Read this sentence to someone who knows you. Would they recognize your voice?',
      ],
    };
  }

  // Default for other clichés
  return {
    prescription: `Delete "${phrase}" and ask: what actually happened that made you want to write this?`,
    sensoryDetails: [
      'What scene would PROVE what you\'re claiming here?',
      'What would a camera capture that shows this is true?',
    ],
    concreteObjects: [
      'What evidence exists that this is true? Name it specifically.',
      'What number or detail would make a skeptic believe you?',
    ],
    microMoment: 'Find the moment this cliché is trying to summarize. Write THAT moment instead.',
    emotionalTruth: 'What are you afraid won\'t come across if you don\'t use this phrase?',
    socraticQuestions: [
      `What specific moment made you want to write "${phrase}"?`,
      'If you had to show this instead of saying it, what would you describe?',
      'What would someone who knows you add to make this more specific?',
    ],
  };
}

/**
 * Create issue for telling-not-showing
 */
export function createTellingIssue(
  telling: TellingNotShowing,
  issueNumber: number,
  uniqueElement: string | null,
  collegeId?: string,
  essayText?: string,
  scenes?: ReturnType<typeof extractNarrativeScenes>
): CriticalIssue {
  // Generate essay-specific micro_moment
  let microMoment = uniqueElement
    ? `Use this unique element as a model: "${uniqueElement.substring(0, 80)}..."`
    : 'Describe the specific moment when this quality appeared';

  if (scenes) {
    if (scenes.timeReferences.length > 0) {
      microMoment = `You already have "${scenes.timeReferences[0]}" in your essay—expand that moment to SHOW "${telling.claimed_quality}" instead of telling us.`;
    } else if (scenes.actionMoments.length > 0) {
      microMoment = `Look at where you wrote "${scenes.actionMoments[0]}"—that's showing. Do the same for "${telling.claimed_quality}".`;
    }
  }

  // Generate essay-specific Socratic questions
  const socraticQuestions: string[] = [];

  if (scenes?.timeReferences.length) {
    socraticQuestions.push(
      `In the "${scenes.timeReferences[0]}" moment, where was "${telling.claimed_quality}" visible in your actions? Describe what a camera would capture.`
    );
  } else {
    socraticQuestions.push(
      `When specifically did you demonstrate "${telling.claimed_quality}"?`
    );
  }

  socraticQuestions.push(
    `What would someone watching you have SEEN in that moment?`,
    `How could you make the reader FEEL this without ever using the word "${telling.claimed_quality}"?`
  );

  return {
    issue_number: issueNumber,
    quote: telling.phrase,
    location: 'Language',
    problem: `You're TELLING us "${telling.claimed_quality}" instead of SHOWING it through action, dialogue, or sensory detail.`,
    symptom_type: 'telling_not_showing',
    diagnosis: telling.what_theyre_telling,
    prescription: telling.how_to_show_instead,

    missing_elements: {
      sensory_details: [
        telling.showing_example,
        'What did it look/sound/feel like when you demonstrated this quality?',
      ],
      concrete_objects: [
        'What object or detail would let readers infer this quality themselves?',
      ],
      micro_moment: microMoment,
      emotional_truth: 'Let the reader feel this rather than being told it',
    },

    relevant_concept: 'Show, don\'t tell',
    relevant_evidence: [],
    socratic_questions: socraticQuestions.slice(0, 3),
    college_value_impacted: 'authentic_voice',
  };
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Map cliché type to symptom type
 */
function mapClicheTypeToSymptom(clicheType: string): ClicheSymptomType {
  switch (clicheType) {
    case 'ai_convergence':
      return 'cliche_ai_convergence';
    case 'essay_cliche':
      return 'cliche_essay_formula';
    case 'college_specific':
      return 'cliche_college_specific';
    case 'inspirational_platitude':
      return 'cliche_inspirational';
    case 'vague_claim':
      return 'cliche_value_signaling';
    default:
      return 'cliche_metaphor';
  }
}

/**
 * Get severity based on cliché type
 */
function getClicheSeverity(clicheType: string): ClicheSeverity {
  switch (clicheType) {
    case 'ai_convergence':
    case 'college_specific':
      return 'critical';
    case 'essay_cliche':
    case 'inspirational_platitude':
      return 'major';
    default:
      return 'minor';
  }
}

// ============================================================================
// INTEGRATION WITH EXISTING PIPELINE
// ============================================================================

/**
 * Options for cliché issue generation
 */
export interface ClicheIssueOptions {
  // Maximum number of cliché issues to generate
  maxIssues?: number;

  // College ID for college-specific context
  collegeId?: string;

  // Essay text for context extraction
  essayText?: string;

  // Include college-specific clichés in output
  includeCollegeSpecific?: boolean;

  // Minimum risk score to generate issues
  minRiskScore?: number;
}

/**
 * Generate cliché issues if analysis warrants them
 *
 * This function decides whether to generate cliché issues based on the
 * analysis results. It's designed to be called alongside the regular
 * Stage 1B diagnosis.
 *
 * @param analysis - SemanticClicheAnalysis from semanticClicheAnalyzer
 * @param options - Configuration options
 * @returns CriticalIssue[] or empty array if no significant clichés
 */
export function generateClicheIssues(
  analysis: SemanticClicheAnalysis,
  options: ClicheIssueOptions = {}
): CriticalIssue[] {
  const {
    maxIssues = 3,
    collegeId,
    essayText,
    minRiskScore = 40,
  } = options;

  // Only generate issues if risk score warrants it
  if (analysis.cliche_risk_score < minRiskScore) {
    return [];
  }

  const issues = convertClicheAnalysisToCriticalIssues(
    analysis,
    collegeId,
    essayText
  );

  // Enhance each issue with deep prescription
  const enhancedIssues = issues.slice(0, maxIssues).map(issue => {
    const deepPrescription = generateDeepPrescription(
      issue,
      essayText || '',
      { collegeId }
    );

    return {
      ...issue,
      deep_prescription: deepPrescription,
    };
  });

  return enhancedIssues;
}

/**
 * Generate cliché issues WITH deep prescriptions attached
 *
 * This is the enhanced version that includes research-backed,
 * essay-specific prescriptions for each issue.
 *
 * @param analysis - SemanticClicheAnalysis from semanticClicheAnalyzer
 * @param essayText - The original essay text (required for essay-specific prescriptions)
 * @param options - Configuration options
 * @returns CriticalIssue[] with deep_prescription field populated
 */
export function generateEnhancedClicheIssues(
  analysis: SemanticClicheAnalysis,
  essayText: string,
  options: ClicheIssueOptions = {}
): CriticalIssue[] {
  const {
    maxIssues = 3,
    collegeId,
    minRiskScore = 40,
  } = options;

  // Only generate issues if risk score warrants it
  if (analysis.cliche_risk_score < minRiskScore) {
    return [];
  }

  const issues = convertClicheAnalysisToCriticalIssues(
    analysis,
    collegeId,
    essayText
  );

  // Generate all deep prescriptions at once for efficiency
  const deepPrescriptions = generateAllDeepPrescriptions(
    issues.slice(0, maxIssues),
    essayText,
    { collegeId }
  );

  // Attach deep prescriptions to issues
  return issues.slice(0, maxIssues).map(issue => ({
    ...issue,
    deep_prescription: deepPrescriptions.get(issue.issue_number),
  }));
}

/**
 * Extract specific quotes from essay text that should be preserved
 * These are concrete, sensory, or unique details that represent good writing
 */
function extractQuotesToPreserve(essayText: string, analysis: SemanticClicheAnalysis): string[] {
  const quotes: string[] = [];

  // Look for specific patterns that indicate good writing:

  // 1. Time-specific moments ("at 2 AM", "14 hours", "3:47 AM")
  const timePatterns = essayText.match(/(?:\d+(?::\d+)?\s*(?:AM|PM|am|pm|a\.m\.|p\.m\.)|(\d+)\s*hours?\s*(straight|later|before)?|at\s+\d+(?::\d+)?)/gi);
  if (timePatterns) {
    timePatterns.forEach(match => {
      // Get surrounding context (up to 60 chars before and after)
      const idx = essayText.indexOf(match);
      const start = Math.max(0, idx - 40);
      const end = Math.min(essayText.length, idx + match.length + 40);
      const context = essayText.slice(start, end).trim();
      if (context.length > 20 && !quotes.includes(context)) {
        quotes.push(context);
      }
    });
  }

  // 2. Specific numbers/statistics ("line 847", "47 versions", "15 failures")
  const numberPatterns = essayText.match(/(?:line\s+\d+|version\s+\d+|\d+\s+(?:attempts?|tries|failures?|versions?|times?))/gi);
  if (numberPatterns) {
    numberPatterns.forEach(match => {
      const idx = essayText.indexOf(match);
      const start = Math.max(0, idx - 30);
      const end = Math.min(essayText.length, idx + match.length + 30);
      const context = essayText.slice(start, end).trim();
      if (context.length > 15 && !quotes.some(q => q.includes(context) || context.includes(q))) {
        quotes.push(context);
      }
    });
  }

  // 3. Sensory details (sounds, smells, specific visual elements)
  const sensoryPatterns = essayText.match(/(?:smelled?\s+(?:like|of)|sounded?\s+(?:like|of)|tasted?\s+(?:like|of)|felt\s+(?:like|rough|smooth|cold|warm)|(?:cursor|screen|keyboard)\s+\w+|ping(?:ing)?|thud(?:ding)?)/gi);
  if (sensoryPatterns) {
    sensoryPatterns.forEach(match => {
      const idx = essayText.indexOf(match);
      const start = Math.max(0, idx - 20);
      const end = Math.min(essayText.length, idx + match.length + 30);
      const context = essayText.slice(start, end).trim();
      if (context.length > 15 && !quotes.some(q => q.includes(context) || context.includes(q))) {
        quotes.push(context);
      }
    });
  }

  // 4. Include the strongest unique element if detected
  if (analysis.strongest_unique_element) {
    quotes.unshift(analysis.strongest_unique_element);
  }

  // Deduplicate and limit
  const uniqueQuotes = [...new Set(quotes)];
  return uniqueQuotes.slice(0, 5);
}

/**
 * Calculate cliché density to avoid over-penalizing essays with isolated clichés
 * Returns a value between 0-1 representing what portion of the essay is clichéd
 */
function calculateClicheDensity(essayText: string, analysis: SemanticClicheAnalysis): number {
  const sentences = essayText.split(/[.!?]+/).filter(s => s.trim().length > 10);
  const totalSentences = sentences.length;

  if (totalSentences === 0) return 0;

  // Count sentences that contain cliché patterns
  let clicheSentences = 0;

  // Check language clichés
  for (const cliche of analysis.language_cliches) {
    const matchingSentences = sentences.filter(s =>
      s.toLowerCase().includes(cliche.phrase.toLowerCase())
    );
    clicheSentences += matchingSentences.length;
  }

  // Check telling-not-showing
  for (const telling of analysis.telling_not_showing) {
    const matchingSentences = sentences.filter(s =>
      s.toLowerCase().includes(telling.phrase.toLowerCase())
    );
    clicheSentences += matchingSentences.length;
  }

  // Avoid double-counting
  clicheSentences = Math.min(clicheSentences, totalSentences);

  return clicheSentences / totalSentences;
}

/**
 * Format cliché issues for Stage 2 handoff
 *
 * Adds the context needed for Stage 2 batch generation.
 * Now includes specific essay quotes to preserve.
 */
export function formatClicheIssuesForStage2(
  issues: CriticalIssue[],
  analysis: SemanticClicheAnalysis,
  essayText?: string
): {
  issues: CriticalIssue[];
  cliche_context: {
    overall_risk: string;
    risk_score: number;
    adjusted_risk_score: number;
    cliche_density: number;
    unique_elements_to_preserve: string[];
    quotes_to_preserve: string[];
    coaching_priority: string;
    calibration_note: string;
  };
} {
  // Calculate density for calibration
  const density = essayText ? calculateClicheDensity(essayText, analysis) : 0;

  // Adjust risk score based on density (isolated clichés should not over-penalize)
  // If density < 0.15 (less than 15% of essay is clichéd), reduce severity
  let adjustedScore = analysis.cliche_risk_score;
  let calibrationNote = '';

  if (density < 0.10) {
    // Less than 10% clichéd - this is an excellent essay with minor issues
    adjustedScore = Math.min(adjustedScore, 35);
    calibrationNote = `Essay is ${Math.round((1 - density) * 100)}% strong. Focus only on fixing the isolated clichéd sentence(s), preserve everything else.`;
  } else if (density < 0.20) {
    // 10-20% clichéd - good essay with some cliché patches
    adjustedScore = Math.round(adjustedScore * 0.8);
    calibrationNote = `Most of this essay is good. Target specific phrases, don't rewrite the whole thing.`;
  } else {
    calibrationNote = `Multiple cliché patterns throughout. Prioritize the most impactful fixes.`;
  }

  // Extract specific quotes to preserve
  const quotesToPreserve = essayText
    ? extractQuotesToPreserve(essayText, analysis)
    : [];

  return {
    issues,
    cliche_context: {
      overall_risk: density < 0.15 ? 'low' : analysis.overall_cliche_risk,
      risk_score: analysis.cliche_risk_score,
      adjusted_risk_score: adjustedScore,
      cliche_density: Math.round(density * 100),
      unique_elements_to_preserve: [
        analysis.strongest_unique_element,
        ...analysis.elements_to_preserve,
      ].filter(Boolean) as string[],
      quotes_to_preserve: quotesToPreserve,
      coaching_priority: analysis.coaching_priority.coaching_approach,
      calibration_note: calibrationNote,
    },
  };
}

// Note: All functions are exported inline with 'export function' syntax
// Types are exported inline with 'export type' syntax
