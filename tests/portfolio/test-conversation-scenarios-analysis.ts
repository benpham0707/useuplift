/**
 * Comprehensive Conversation Scenarios Analysis
 *
 * This test analyzes system robustness by testing various response types:
 * 1. Sparse/Minimal responses - Student gives short, unhelpful answers
 * 2. Off-topic/Tangential responses - Student goes off on tangents
 * 3. Overly verbose responses - Student rambles without structure
 * 4. Highly detailed responses - Student gives excellent, rich answers
 * 5. Defensive/Reluctant responses - Student is hesitant to share
 * 6. Contradictory responses - Student gives conflicting information
 * 7. Humble/Self-deprecating responses - Student undersells themselves
 *
 * For each scenario, we analyze:
 * - Extraction quality
 * - Question adaptation
 * - Profile completeness
 * - System recovery strategies
 * - Final description quality
 */

import '../utils/loadEnv';

import {
  activityProfileChatService,
  activityProfileService,
  profileDescriptionGenerator,
  ConversationState,
} from '../../src/services/portfolioStrategy/services/activityWorkshop';

import {
  descriptionScoringService,
} from '../../src/services/portfolioStrategy/services/activityWorkshop/scoring';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestScenario {
  name: string;
  description: string;
  activity: {
    id: string;
    title: string;
    description: string;
    position: string;
    category: string;
    hoursPerWeek: number;
    weeksPerYear: number;
  };
  responses: string[];
  expectedChallenges: string[];
}

const SCENARIOS: TestScenario[] = [
  // ========================================================================
  // SCENARIO 1: SPARSE/MINIMAL RESPONSES
  // ========================================================================
  {
    name: 'Sparse Responder',
    description: 'Student gives short, minimal answers without elaboration',
    activity: {
      id: 'sparse-001',
      title: 'Basketball Team',
      description: 'Played basketball. Was on varsity.',
      position: 'Point Guard',
      category: 'Athletics',
      hoursPerWeek: 15,
      weeksPerYear: 30,
    },
    responses: [
      "Yeah, I play point guard.",
      "We won some games.",
      "It was fun I guess.",
      "I don't know, just practiced a lot.",
    ],
    expectedChallenges: ['low_extraction', 'need_probing', 'minimal_profile'],
  },

  // ========================================================================
  // SCENARIO 2: OFF-TOPIC/TANGENTIAL RESPONSES
  // ========================================================================
  {
    name: 'Tangential Responder',
    description: 'Student goes off on tangents, mentions unrelated things',
    activity: {
      id: 'tangent-001',
      title: 'School Newspaper',
      description: 'Write articles for paper.',
      position: 'Staff Writer',
      category: 'Publications',
      hoursPerWeek: 8,
      weeksPerYear: 36,
    },
    responses: [
      "Well I started writing because my friend Sarah joined and she's really into journalism, you know? Her mom is a reporter for the local news station and they have this really cool studio downtown that I visited once last summer when we were hanging out.",
      "The editor is kind of strict but anyway my favorite article was about the new lunch menu because I really care about food quality. Speaking of which, did you know our cafeteria used to have a pizza place that closed down? That was so sad.",
      "I've been thinking about maybe doing communications in college but also maybe business because my uncle says there's more money in that. He works at a bank. Banks are really interesting actually.",
      "I guess I learned how to write better? My English teacher says I use too many commas though. She's really nice but her class is so early in the morning.",
    ],
    expectedChallenges: ['filter_noise', 'extract_relevant', 'refocus_conversation'],
  },

  // ========================================================================
  // SCENARIO 3: OVERLY VERBOSE/RAMBLING RESPONSES
  // ========================================================================
  {
    name: 'Verbose Rambler',
    description: 'Student provides lots of text but lacks focus and structure',
    activity: {
      id: 'verbose-001',
      title: 'Community Service Club',
      description: 'Volunteered in community.',
      position: 'Member',
      category: 'Community Service',
      hoursPerWeek: 4,
      weeksPerYear: 40,
    },
    responses: [
      "Oh wow where do I even start there's so much to say about this club because we do so many things like we go to the food bank on Saturdays and sometimes we help at the animal shelter and there was this one time we painted a mural at the elementary school and we also do beach cleanups in the summer and holiday toy drives in December and I think we've helped a lot of people over the years though I'm not exactly sure how many but it's definitely a lot and everyone in the club is really nice and we always have a good time even when we're tired from working all day because it just feels good to help people you know what I mean?",
      "So I've been in the club since freshman year when my guidance counselor suggested it because she thought I'd be good at it and I guess she was right because I really enjoy it and I've made a lot of friends and we've done so many projects together like the food drive where we collected I think maybe 500 cans or maybe it was more I can't remember exactly but it was a lot and people were really grateful and it made me feel like I was making a difference even though sometimes it's hard to see the immediate impact but I know it adds up over time.",
      "The best part is probably the people like my friend Marcus who's also in the club and we always partner up for projects and there was this one time we organized the entire supply closet at the homeless shelter and it took like 4 hours but we were so proud of ourselves afterwards and the shelter manager said it was the most organized she'd ever seen it which felt really good because usually things are pretty chaotic there with all the donations coming in.",
      "I think I've grown a lot from this experience in terms of like being more responsible and caring about others and seeing how lucky I am compared to some people and it's changed my perspective on a lot of things and made me want to keep helping even after high school maybe by studying social work or nonprofit management or something like that because I want to make this kind of thing my career somehow.",
    ],
    expectedChallenges: ['parse_structure', 'identify_key_points', 'extract_metrics'],
  },

  // ========================================================================
  // SCENARIO 4: HIGHLY DETAILED/EXCELLENT RESPONSES
  // ========================================================================
  {
    name: 'Detailed Excellence',
    description: 'Student provides rich, well-structured, specific answers',
    activity: {
      id: 'excellent-001',
      title: 'Robotics Team',
      description: 'Built robots for competitions.',
      position: 'Lead Programmer',
      category: 'STEM',
      hoursPerWeek: 20,
      weeksPerYear: 40,
    },
    responses: [
      "I joined robotics in 9th grade as a complete novice - I'd never written a line of code. By sophomore year, I'd taught myself Python and C++ through online courses. Junior year, our mentor asked me to lead the programming subteam of 6 students. I created a structured curriculum to train new members, which reduced our onboarding time from 8 weeks to 3 weeks.",
      "Our biggest achievement was winning the Innovation Award at the FIRST Robotics Regional in March 2024. We competed against 48 teams. What set us apart was our autonomous navigation system - I developed an algorithm that used computer vision to identify game pieces 40% faster than our previous approach. This wasn't just my work though; I collaborated closely with our mechanical and electrical teams to integrate the sensors.",
      "The hardest challenge was when our main robot failed 2 hours before our biggest match at State Championships. I had to rewrite our entire autonomous routine in 90 minutes while staying calm for my team. We ended up finishing 4th overall - not our goal of 1st, but I learned more about leadership under pressure in those 90 minutes than in the entire season.",
      "What I'm most proud of isn't a trophy - it's that 3 of the freshmen I trained this year are now teaching the next cohort. One of them, a girl named Priya who was terrified of coding when she started, just won our school's 'Rising Engineer' award. Creating that kind of ripple effect matters more to me than any competition result.",
    ],
    expectedChallenges: ['maintain_quality', 'avoid_redundant_questions', 'synthesize_richness'],
  },

  // ========================================================================
  // SCENARIO 5: DEFENSIVE/RELUCTANT RESPONSES
  // ========================================================================
  {
    name: 'Reluctant Sharer',
    description: 'Student is hesitant, defensive, or uncomfortable sharing',
    activity: {
      id: 'reluctant-001',
      title: 'Math Tutoring',
      description: 'Tutored students in math.',
      position: 'Tutor',
      category: 'Academic Support',
      hoursPerWeek: 6,
      weeksPerYear: 32,
    },
    responses: [
      "I mean, it's just tutoring. Nothing special really. I just help kids with their homework.",
      "I don't want to sound like I'm bragging or anything. I just show them how to do the problems. Anyone could do it.",
      "I guess some students improved? I don't really keep track of stuff like that. Their grades are their business.",
      "Look, I don't know why you need all these details. I just sit with them and explain math. That's it.",
    ],
    expectedChallenges: ['build_rapport', 'overcome_resistance', 'extract_despite_reluctance'],
  },

  // ========================================================================
  // SCENARIO 6: HUMBLE/SELF-DEPRECATING RESPONSES
  // ========================================================================
  {
    name: 'Humble Underseller',
    description: 'Student consistently downplays their achievements',
    activity: {
      id: 'humble-001',
      title: 'Science Olympiad',
      description: 'Competed in science competitions.',
      position: 'Captain',
      category: 'Academic Competition',
      hoursPerWeek: 10,
      weeksPerYear: 30,
    },
    responses: [
      "I'm the captain but honestly anyone could do it. I just make the schedules and stuff. The other members are way smarter than me.",
      "We won state, but it was really a team effort. I didn't contribute that much. The freshmen on our team were the real stars.",
      "I guess I helped organize practice sessions? But honestly I feel like I could have done more. I'm not that good at the actual science parts.",
      "They gave me some leadership award but I don't think I deserved it. There were so many other people who worked harder than me.",
    ],
    expectedChallenges: ['recognize_underselling', 'reframe_contributions', 'extract_real_impact'],
  },

  // ========================================================================
  // SCENARIO 7: CONTRADICTORY RESPONSES
  // ========================================================================
  {
    name: 'Contradictory Information',
    description: 'Student gives conflicting information across responses',
    activity: {
      id: 'contradict-001',
      title: 'Student Council',
      description: 'Member of student council.',
      position: 'Treasurer',
      category: 'Student Government',
      hoursPerWeek: 5,
      weeksPerYear: 36,
    },
    responses: [
      "I manage a budget of about $5,000 for student activities. It's a lot of responsibility tracking all those expenses.",
      "We don't really have that much money to work with - maybe like $1,500 total. Most events are funded by donations.",
      "I've been treasurer for 3 years now, since freshman year when I first joined council.",
      "I actually just became treasurer this year. Before that I was just a class representative.",
    ],
    expectedChallenges: ['detect_contradictions', 'seek_clarification', 'resolve_conflicts'],
  },
];

// ============================================================================
// ANALYSIS UTILITIES
// ============================================================================

interface ScenarioResult {
  scenario: string;
  turnsCompleted: number;
  profileCompleteness: number;
  extractionQuality: {
    totalDataPoints: number;
    totalQuotes: number;
    qualityPerTurn: string[];
  };
  questionAdaptation: {
    totalQuestionsAsked: number;
    followUpQuestions: number;
    redundantQuestions: number;
  };
  systemBehavior: {
    handledChallengesWell: string[];
    struggledWith: string[];
    suggestions: string[];
  };
  descriptionGeneration: {
    originalScore: number | null;
    improvedScore: number | null;
    scoreImprovement: number | null;
    generatedDescription: string | null;
  };
  tokenUsage: {
    totalInput: number;
    totalOutput: number;
    cost: number;
  };
}

function analyzeQuestionAdaptation(state: ConversationState): {
  totalQuestionsAsked: number;
  followUpQuestions: number;
  redundantQuestions: number;
} {
  const questionsAsked = state.questionsAsked || [];
  const followUpQuestions = questionsAsked.filter(q => q.isFollowUp).length;

  // Detect redundant questions (same target field asked multiple times)
  const fieldCounts = new Map<string, number>();
  for (const q of questionsAsked) {
    const count = fieldCounts.get(q.targetField) || 0;
    fieldCounts.set(q.targetField, count + 1);
  }
  const redundantQuestions = Array.from(fieldCounts.values()).filter(c => c > 1).length;

  return {
    totalQuestionsAsked: questionsAsked.length,
    followUpQuestions,
    redundantQuestions,
  };
}

function analyzeSystemBehavior(
  scenario: TestScenario,
  state: ConversationState,
  result: ScenarioResult
): { handledWell: string[]; struggledWith: string[]; suggestions: string[] } {
  const handledWell: string[] = [];
  const struggledWith: string[] = [];
  const suggestions: string[] = [];

  // Check extraction quality vs expected challenges
  const avgDataPointsPerTurn = result.extractionQuality.totalDataPoints / Math.max(1, result.turnsCompleted);

  if (scenario.expectedChallenges.includes('low_extraction')) {
    if (avgDataPointsPerTurn < 3) {
      struggledWith.push('Could not extract much from sparse responses');
      suggestions.push('Add more probing follow-up questions for short responses');
    } else {
      handledWell.push('Managed to extract data despite sparse responses');
    }
  }

  if (scenario.expectedChallenges.includes('filter_noise')) {
    const relevantQuotes = state.extractedInfo.quotes.length;
    if (relevantQuotes > 0) {
      handledWell.push('Successfully filtered relevant information from tangential responses');
    } else {
      struggledWith.push('Struggled to extract relevant content from off-topic responses');
      suggestions.push('Implement better noise filtering in extraction');
    }
  }

  if (scenario.expectedChallenges.includes('parse_structure')) {
    if (result.extractionQuality.totalDataPoints > 10) {
      handledWell.push('Successfully parsed structure from verbose responses');
    } else {
      struggledWith.push('Lost information in verbose, unstructured responses');
      suggestions.push('Add sentence segmentation and key phrase extraction');
    }
  }

  if (scenario.expectedChallenges.includes('maintain_quality')) {
    if (result.questionAdaptation.redundantQuestions === 0) {
      handledWell.push('Avoided redundant questions with excellent responder');
    } else {
      struggledWith.push('Asked redundant questions despite receiving detailed answers');
      suggestions.push('Improve field-level tracking to skip already-answered questions');
    }
  }

  if (scenario.expectedChallenges.includes('build_rapport')) {
    // Check if questions became more open/less demanding
    const lastQuestion = state.questionsAsked[state.questionsAsked.length - 1];
    if (lastQuestion?.category === 'open_exploratory') {
      handledWell.push('Adapted question style for reluctant responder');
    } else {
      struggledWith.push('Did not adapt tone for defensive student');
      suggestions.push('Detect reluctance and switch to gentler, more open questions');
    }
  }

  if (scenario.expectedChallenges.includes('recognize_underselling')) {
    // Check if we captured achievements despite humble framing
    const recognitions = state.currentProfile.facts.recognition;
    if (recognitions.length > 0) {
      handledWell.push('Extracted achievements despite self-deprecation');
    } else {
      struggledWith.push('Missed achievements due to humble framing');
      suggestions.push('Add pattern recognition for underselling language');
    }
  }

  if (scenario.expectedChallenges.includes('detect_contradictions')) {
    // Check if clarification was sought
    const clarificationQuestions = state.questionsAsked.filter(q =>
      q.category === 'clarification' || q.question.toLowerCase().includes('clarify')
    );
    if (clarificationQuestions.length > 0) {
      handledWell.push('Detected and sought clarification for contradictions');
    } else {
      struggledWith.push('Did not detect contradictory information');
      suggestions.push('Add contradiction detection in extraction');
    }
  }

  // Check overall profile quality
  if (result.profileCompleteness >= 50) {
    handledWell.push(`Achieved ${result.profileCompleteness}% profile completeness`);
  } else {
    struggledWith.push(`Only achieved ${result.profileCompleteness}% profile completeness`);
    suggestions.push('Consider asking more targeted questions when extraction is low');
  }

  // Check description improvement
  if (result.descriptionGeneration.scoreImprovement !== null) {
    if (result.descriptionGeneration.scoreImprovement >= 3) {
      handledWell.push(`Significant score improvement: +${result.descriptionGeneration.scoreImprovement}`);
    } else if (result.descriptionGeneration.scoreImprovement <= 1) {
      struggledWith.push(`Minimal score improvement: +${result.descriptionGeneration.scoreImprovement}`);
      suggestions.push('Profile depth may be insufficient for quality description generation');
    }
  }

  return { handledWell, struggledWith, suggestions };
}

// ============================================================================
// CONSOLE OUTPUT HELPERS
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  bgBlue: '\x1b[44m',
  bgGreen: '\x1b[42m',
  bgYellow: '\x1b[43m',
  bgRed: '\x1b[41m',
  white: '\x1b[37m',
};

function printHeader(text: string) {
  console.log('\n');
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}${'═'.repeat(90)}${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}  ${text.padEnd(86)}${COLORS.reset}`);
  console.log(`${COLORS.bgBlue}${COLORS.white}${COLORS.bright}${'═'.repeat(90)}${COLORS.reset}`);
}

function printSubHeader(text: string) {
  console.log(`\n${COLORS.cyan}${COLORS.bright}── ${text} ${'─'.repeat(Math.max(0, 80 - text.length))}${COLORS.reset}`);
}

function printScenarioHeader(name: string, description: string) {
  console.log(`\n${COLORS.bgYellow}${COLORS.bright}  SCENARIO: ${name.padEnd(74)}${COLORS.reset}`);
  console.log(`${COLORS.dim}  ${description}${COLORS.reset}`);
}

function printMetric(label: string, value: string | number, color: string = COLORS.white) {
  console.log(`   ${label.padEnd(30)} ${color}${value}${COLORS.reset}`);
}

function printList(items: string[], color: string, prefix: string = '•') {
  for (const item of items) {
    console.log(`   ${color}${prefix}${COLORS.reset} ${item}`);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runScenario(scenario: TestScenario): Promise<ScenarioResult> {
  console.log(`\n${COLORS.dim}Starting scenario: ${scenario.name}...${COLORS.reset}`);

  // Initialize result
  const result: ScenarioResult = {
    scenario: scenario.name,
    turnsCompleted: 0,
    profileCompleteness: 0,
    extractionQuality: {
      totalDataPoints: 0,
      totalQuotes: 0,
      qualityPerTurn: [],
    },
    questionAdaptation: {
      totalQuestionsAsked: 0,
      followUpQuestions: 0,
      redundantQuestions: 0,
    },
    systemBehavior: {
      handledChallengesWell: [],
      struggledWith: [],
      suggestions: [],
    },
    descriptionGeneration: {
      originalScore: null,
      improvedScore: null,
      scoreImprovement: null,
      generatedDescription: null,
    },
    tokenUsage: {
      totalInput: 0,
      totalOutput: 0,
      cost: 0,
    },
  };

  try {
    // Score original description
    const baselineResult = await descriptionScoringService.scoreDescription({
      description: scenario.activity.description,
      activityTitle: scenario.activity.title,
      activityType: scenario.activity.category,
      position: scenario.activity.position,
      hoursPerWeek: scenario.activity.hoursPerWeek,
      weeksPerYear: scenario.activity.weeksPerYear,
    });
    result.descriptionGeneration.originalScore = baselineResult.score?.total || null;

    // Start conversation
    const startResult = await activityProfileChatService.startConversation({
      activityId: scenario.activity.id,
      activityTitle: scenario.activity.title,
      trigger: 'description_improvement',
      basicData: {
        description: scenario.activity.description,
        position: scenario.activity.position,
        hoursPerWeek: scenario.activity.hoursPerWeek,
        weeksPerYear: scenario.activity.weeksPerYear,
        activityType: scenario.activity.category,
      },
    });

    if (!startResult.success || !startResult.state) {
      console.log(`${COLORS.red}Failed to start conversation${COLORS.reset}`);
      return result;
    }

    let state = startResult.state;

    // Process each response
    for (const response of scenario.responses) {
      const processResult = await activityProfileChatService.processUserResponse({
        state,
        response,
      });

      if (!processResult.success || !processResult.state) {
        console.log(`${COLORS.yellow}Warning: Failed to process response${COLORS.reset}`);
        continue;
      }

      state = processResult.state;
      result.turnsCompleted++;

      // Track extraction quality
      if (processResult.extraction) {
        result.extractionQuality.totalDataPoints += processResult.extraction.extractedFields.length;
        result.extractionQuality.totalQuotes += processResult.extraction.authenticQuotes.length;
        result.extractionQuality.qualityPerTurn.push(processResult.extraction.extractionQuality);
      }

      // Update token usage
      if (state.tokenUsage) {
        result.tokenUsage.totalInput = state.tokenUsage.totalInputTokens;
        result.tokenUsage.totalOutput = state.tokenUsage.totalOutputTokens;
        result.tokenUsage.cost = state.tokenUsage.estimatedCost;
      }
    }

    // Calculate final metrics
    result.profileCompleteness = activityProfileService.calculateCompleteness(state.currentProfile).overall;
    result.questionAdaptation = analyzeQuestionAdaptation(state);

    // Generate improved description
    const generationResult = await profileDescriptionGenerator.generateDescriptions({
      profile: state.currentProfile,
      currentDescription: scenario.activity.description,
      targetLength: 150,
    });

    if (generationResult.success && generationResult.primary) {
      result.descriptionGeneration.generatedDescription = generationResult.primary.text;

      // Score the new description
      const newScoreResult = await descriptionScoringService.scoreDescription({
        description: generationResult.primary.text,
        activityTitle: scenario.activity.title,
        activityType: scenario.activity.category,
        position: scenario.activity.position,
        hoursPerWeek: scenario.activity.hoursPerWeek,
        weeksPerYear: scenario.activity.weeksPerYear,
      });

      result.descriptionGeneration.improvedScore = newScoreResult.score?.total || null;

      if (result.descriptionGeneration.originalScore !== null && result.descriptionGeneration.improvedScore !== null) {
        result.descriptionGeneration.scoreImprovement =
          result.descriptionGeneration.improvedScore - result.descriptionGeneration.originalScore;
      }
    }

    // Analyze system behavior
    const behavior = analyzeSystemBehavior(scenario, state, result);
    result.systemBehavior.handledChallengesWell = behavior.handledWell;
    result.systemBehavior.struggledWith = behavior.struggledWith;
    result.systemBehavior.suggestions = behavior.suggestions;

  } catch (error) {
    console.log(`${COLORS.red}Error in scenario: ${error}${COLORS.reset}`);
  }

  return result;
}

async function runAnalysis() {
  printHeader('CONVERSATION SCENARIOS ANALYSIS');
  console.log(`\n${COLORS.dim}Testing system robustness across ${SCENARIOS.length} different response patterns${COLORS.reset}`);

  const results: ScenarioResult[] = [];

  for (const scenario of SCENARIOS) {
    printScenarioHeader(scenario.name, scenario.description);

    const result = await runScenario(scenario);
    results.push(result);

    // Print scenario results
    printSubHeader('EXTRACTION METRICS');
    printMetric('Turns Completed', result.turnsCompleted);
    printMetric('Total Data Points', result.extractionQuality.totalDataPoints,
      result.extractionQuality.totalDataPoints > 15 ? COLORS.green : COLORS.yellow);
    printMetric('Total Quotes', result.extractionQuality.totalQuotes);
    printMetric('Quality per Turn', result.extractionQuality.qualityPerTurn.join(' → '));
    printMetric('Profile Completeness', `${result.profileCompleteness}%`,
      result.profileCompleteness >= 50 ? COLORS.green : COLORS.red);

    printSubHeader('QUESTION ADAPTATION');
    printMetric('Questions Asked', result.questionAdaptation.totalQuestionsAsked);
    printMetric('Follow-up Questions', result.questionAdaptation.followUpQuestions);
    printMetric('Redundant Questions', result.questionAdaptation.redundantQuestions,
      result.questionAdaptation.redundantQuestions === 0 ? COLORS.green : COLORS.red);

    printSubHeader('DESCRIPTION IMPROVEMENT');
    printMetric('Original Score', result.descriptionGeneration.originalScore || 'N/A');
    printMetric('Improved Score', result.descriptionGeneration.improvedScore || 'N/A',
      (result.descriptionGeneration.improvedScore || 0) >= 7 ? COLORS.green : COLORS.yellow);
    printMetric('Score Improvement', result.descriptionGeneration.scoreImprovement !== null
      ? `+${result.descriptionGeneration.scoreImprovement.toFixed(1)}` : 'N/A',
      (result.descriptionGeneration.scoreImprovement || 0) >= 3 ? COLORS.green : COLORS.yellow);

    if (result.descriptionGeneration.generatedDescription) {
      console.log(`\n   ${COLORS.bright}Generated:${COLORS.reset}`);
      console.log(`   "${result.descriptionGeneration.generatedDescription.substring(0, 100)}..."`);
    }

    printSubHeader('SYSTEM BEHAVIOR ANALYSIS');
    if (result.systemBehavior.handledChallengesWell.length > 0) {
      console.log(`\n   ${COLORS.green}${COLORS.bright}Handled Well:${COLORS.reset}`);
      printList(result.systemBehavior.handledChallengesWell, COLORS.green, '✓');
    }
    if (result.systemBehavior.struggledWith.length > 0) {
      console.log(`\n   ${COLORS.red}${COLORS.bright}Struggled With:${COLORS.reset}`);
      printList(result.systemBehavior.struggledWith, COLORS.red, '✗');
    }
    if (result.systemBehavior.suggestions.length > 0) {
      console.log(`\n   ${COLORS.yellow}${COLORS.bright}Improvement Suggestions:${COLORS.reset}`);
      printList(result.systemBehavior.suggestions, COLORS.yellow, '→');
    }

    printMetric('Cost', `$${result.tokenUsage.cost.toFixed(4)}`);
  }

  // ========================================================================
  // AGGREGATE ANALYSIS
  // ========================================================================
  printHeader('AGGREGATE ANALYSIS ACROSS ALL SCENARIOS');

  const totalCost = results.reduce((sum, r) => sum + r.tokenUsage.cost, 0);
  const avgCompleteness = results.reduce((sum, r) => sum + r.profileCompleteness, 0) / results.length;
  const avgDataPoints = results.reduce((sum, r) => sum + r.extractionQuality.totalDataPoints, 0) / results.length;
  const avgImprovement = results
    .filter(r => r.descriptionGeneration.scoreImprovement !== null)
    .reduce((sum, r) => sum + (r.descriptionGeneration.scoreImprovement || 0), 0) /
    results.filter(r => r.descriptionGeneration.scoreImprovement !== null).length;

  printSubHeader('OVERALL METRICS');
  printMetric('Scenarios Tested', results.length);
  printMetric('Avg Profile Completeness', `${avgCompleteness.toFixed(1)}%`);
  printMetric('Avg Data Points/Scenario', avgDataPoints.toFixed(1));
  printMetric('Avg Score Improvement', `+${avgImprovement.toFixed(1)}`);
  printMetric('Total Cost', `$${totalCost.toFixed(4)}`);

  // Aggregate all suggestions
  printSubHeader('ALL IMPROVEMENT OPPORTUNITIES');
  const allSuggestions = new Set<string>();
  const allStruggles = new Set<string>();

  for (const result of results) {
    for (const s of result.systemBehavior.suggestions) allSuggestions.add(s);
    for (const s of result.systemBehavior.struggledWith) allStruggles.add(s);
  }

  console.log(`\n   ${COLORS.red}${COLORS.bright}Common Struggles:${COLORS.reset}`);
  printList(Array.from(allStruggles), COLORS.red, '✗');

  console.log(`\n   ${COLORS.yellow}${COLORS.bright}Recommended Improvements:${COLORS.reset}`);
  printList(Array.from(allSuggestions), COLORS.yellow, '→');

  // Best and worst scenarios
  printSubHeader('SCENARIO PERFORMANCE RANKING');
  const ranked = [...results].sort((a, b) =>
    (b.descriptionGeneration.scoreImprovement || 0) - (a.descriptionGeneration.scoreImprovement || 0)
  );

  console.log(`\n   ${COLORS.green}${COLORS.bright}Best Performance:${COLORS.reset}`);
  console.log(`   ${ranked[0].scenario}: +${ranked[0].descriptionGeneration.scoreImprovement?.toFixed(1)} improvement, ${ranked[0].profileCompleteness}% complete`);

  console.log(`\n   ${COLORS.red}${COLORS.bright}Most Challenging:${COLORS.reset}`);
  const worst = ranked[ranked.length - 1];
  console.log(`   ${worst.scenario}: +${worst.descriptionGeneration.scoreImprovement?.toFixed(1)} improvement, ${worst.profileCompleteness}% complete`);

  // ========================================================================
  // SPECIFIC RECOMMENDATIONS
  // ========================================================================
  printHeader('DETAILED IMPROVEMENT RECOMMENDATIONS');

  console.log(`
${COLORS.bright}1. SPARSE RESPONSE HANDLING${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} Short responses yield minimal data extraction
   ${COLORS.green}Solution:${COLORS.reset}
   - Detect response length < 20 words
   - Automatically ask clarifying follow-up: "Can you tell me more about [last topic]?"
   - Use softer prompts: "I'd love to hear more details if you're comfortable sharing"

${COLORS.bright}2. TANGENTIAL RESPONSE FILTERING${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} Off-topic content dilutes extraction quality
   ${COLORS.green}Solution:${COLORS.reset}
   - Add relevance scoring to extraction prompt
   - Filter sentences by activity-relevance before extraction
   - Gently redirect: "That's interesting! Coming back to [activity], can you tell me..."

${COLORS.bright}3. VERBOSE RESPONSE PARSING${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} Long, unstructured responses lose key information
   ${COLORS.green}Solution:${COLORS.reset}
   - Break long responses into sentence-level analysis
   - Extract key metrics even from run-on text
   - Summarize what was captured: "I heard you mention X, Y, Z - is that right?"

${COLORS.bright}4. UNDERSELLING/HUMILITY DETECTION${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} Humble students understate their achievements
   ${COLORS.green}Solution:${COLORS.reset}
   - Detect phrases: "anyone could", "not a big deal", "I just..."
   - Reframe questions: "Even if it felt normal to you, what did you actually do?"
   - Add extraction hint: "Look for achievements hidden behind humble language"

${COLORS.bright}5. CONTRADICTION RESOLUTION${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} Conflicting information creates unreliable profiles
   ${COLORS.green}Solution:${COLORS.reset}
   - Track numeric values with timestamps
   - Flag when new values conflict with previous
   - Ask clarifying questions: "Earlier you mentioned $5,000, but now $1,500 - which is accurate?"

${COLORS.bright}6. RELUCTANCE ADAPTATION${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} Defensive students shut down with direct questions
   ${COLORS.green}Solution:${COLORS.reset}
   - Detect reluctance patterns: short answers, "I don't know", deflection
   - Switch to more open-ended questions
   - Validate their perspective: "It sounds like you're being modest..."

${COLORS.bright}7. QUESTION INTELLIGENCE${COLORS.reset}
   ${COLORS.yellow}Problem:${COLORS.reset} System sometimes asks redundant questions
   ${COLORS.green}Solution:${COLORS.reset}
   - Track answered fields at granular level
   - Skip questions about already-extracted data
   - Generate questions based on profile gaps, not templates
`);

  console.log(`\n${'═'.repeat(90)}\n`);
}

// Run the analysis
runAnalysis().catch(console.error);
