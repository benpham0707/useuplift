/**
 * Topic Detector
 *
 * Analyzes the quantitative capability profile to identify conversation topics.
 * Prioritizes topics by importance and generates contextual questions.
 *
 * Philosophy:
 * - Ask about anomalies first (they reveal the most)
 * - High-stakes courses deserve attention
 * - Transitions between difficulty levels are key moments
 * - Don't overwhelm with questions - prioritize ruthlessly
 * - Cross-subject patterns reveal systemic issues (NEW)
 */

import { callClaude } from '../../../../../../lib/llm/claude';
import type { NuancedCapabilityAnalysis, SubjectPattern } from '../nuancedCapabilityAnalyzer';
import type { SubjectArea } from '../types';
import { GPA_TO_GRADE } from '../types';
import type { DeepAcademicReport } from '../deepAcademicReportTypes';
import type {
  ConversationTopic,
  TopicType,
  TargetInsight,
} from './types';

// ============================================================================
// CROSS-SUBJECT PATTERN TYPES
// ============================================================================

export interface CrossSubjectPattern {
  /** Unique identifier for this pattern */
  id: string;
  /** Type of cross-subject pattern detected */
  patternType: CrossSubjectPatternType;
  /** Human-readable description */
  description: string;
  /** Subjects involved in this pattern */
  affectedSubjects: SubjectArea[];
  /** Timeframe if applicable */
  timeframe?: string;
  /** Confidence in this pattern (0-100) */
  confidence: number;
  /** Why this matters for the conversation */
  significance: string;
  /** Generated question for this pattern */
  suggestedQuestion: string;
  /** Follow-up questions */
  followUpQuestions: string[];
  /** Priority score (1-10) */
  priority: number;
}

export type CrossSubjectPatternType =
  | 'sophomore_slump' // Decline across all subjects in one year
  | 'stem_humanities_divergence' // STEM improving while humanities declining or vice versa
  | 'universal_decline' // Declining in all subjects
  | 'universal_improvement' // Improving in all subjects
  | 'workload_impact' // Adding more APs correlated with drops
  | 'single_subject_anchor' // One subject dragging down overall while others strong
  | 'difficulty_ceiling' // Struggling with all advanced courses
  | 'recovery_pattern' // Recovered from a bad year/semester
  | 'external_factor_signature' // Pattern suggests external life event
  | 'interest_cluster' // Related subjects showing similar patterns;

// ============================================================================
// TOPIC DETECTION
// ============================================================================

/**
 * Detects conversation topics from a quantitative analysis.
 * Returns prioritized list of topics to explore.
 */
export function detectTopics(
  analysis: NuancedCapabilityAnalysis,
  options: {
    maxTopics?: number;
    intendedMajor?: string;
    prioritizeAnomalies?: boolean;
  } = {}
): ConversationTopic[] {
  const maxTopics = options.maxTopics ?? 20;
  const prioritizeAnomalies = options.prioritizeAnomalies ?? true;

  const topics: ConversationTopic[] = [];
  let topicId = 1;

  const makeTopicId = () => `topic_${topicId++}`;

  // -------------------------------------------------------------------------
  // 1. GRADE ANOMALIES (Highest Priority)
  // -------------------------------------------------------------------------
  const anomalyTopics = detectGradeAnomalies(analysis, makeTopicId);
  topics.push(...anomalyTopics);

  // -------------------------------------------------------------------------
  // 2. DIFFICULTY TRANSITIONS
  // -------------------------------------------------------------------------
  const transitionTopics = detectDifficultyTransitions(analysis, makeTopicId);
  topics.push(...transitionTopics);

  // -------------------------------------------------------------------------
  // 3. HIGH-STAKES COURSES (Major-related)
  // -------------------------------------------------------------------------
  if (options.intendedMajor) {
    const highStakesTopics = detectHighStakesCourses(
      analysis,
      options.intendedMajor,
      makeTopicId
    );
    topics.push(...highStakesTopics);
  }

  // -------------------------------------------------------------------------
  // 4. SUBJECT INCONSISTENCIES
  // -------------------------------------------------------------------------
  const inconsistencyTopics = detectSubjectInconsistencies(analysis, makeTopicId);
  topics.push(...inconsistencyTopics);

  // -------------------------------------------------------------------------
  // 5. TREND EXPLORATIONS
  // -------------------------------------------------------------------------
  const trendTopics = detectTrendPatterns(analysis, makeTopicId);
  topics.push(...trendTopics);

  // -------------------------------------------------------------------------
  // 6. SUBJECT OVERVIEWS (Lower Priority - General Coverage)
  // -------------------------------------------------------------------------
  const overviewTopics = generateSubjectOverviews(analysis, makeTopicId);
  topics.push(...overviewTopics);

  // -------------------------------------------------------------------------
  // Sort by priority and limit
  // -------------------------------------------------------------------------
  const sortedTopics = topics.sort((a, b) => b.priority - a.priority);

  // Ensure anomalies are at the top if prioritized
  if (prioritizeAnomalies) {
    const anomalies = sortedTopics.filter((t) => t.type === 'grade_anomaly');
    const others = sortedTopics.filter((t) => t.type !== 'grade_anomaly');
    return [...anomalies, ...others].slice(0, maxTopics);
  }

  return sortedTopics.slice(0, maxTopics);
}

// ============================================================================
// ANOMALY DETECTION
// ============================================================================

function detectGradeAnomalies(
  analysis: NuancedCapabilityAnalysis,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    const avgGPA = pattern.performanceHistory.avgGPA;

    for (const course of pattern.performanceHistory.courses) {
      const deviation = Math.abs(course.grade - avgGPA);

      // Significant deviation (more than half a letter grade)
      if (deviation > 0.5) {
        const isHigher = course.grade > avgGPA;
        const gradeStr = GPA_TO_GRADE(course.grade);
        const avgStr = GPA_TO_GRADE(avgGPA);

        topics.push({
          id: makeTopicId(),
          type: 'grade_anomaly',
          priority: 9 + Math.min(deviation, 1), // Higher deviation = higher priority
          scope: {
            course: course.name,
            subject: subject as SubjectArea,
          },
          context: isHigher
            ? `${course.name} grade (${gradeStr}) is notably higher than their ${formatSubject(subject)} average (${avgStr})`
            : `${course.name} grade (${gradeStr}) is notably lower than their ${formatSubject(subject)} average (${avgStr})`,
          primaryQuestion: isHigher
            ? `I noticed you did really well in ${course.name} - ${gradeStr} when your ${formatSubject(subject)} average is usually around ${avgStr}. What made that class work so well for you?`
            : `I noticed ${course.name} stands out a bit - you got a ${gradeStr} when you usually do around ${avgStr} in ${formatSubject(subject)}. What was going on there?`,
          followUpQuestions: isHigher
            ? [
                'Was there something special about that teacher or class?',
                'Did you put in extra effort, or did it just click for you?',
                'Would you say that grade reflects your true ability?',
              ]
            : [
                'Was there something specific about that class that made it harder?',
                'Were there any external factors going on at that time?',
                'How hard did you work for that grade?',
                'How do you feel about that subject now?',
              ],
          targetInsights: [
            'effort_level',
            'teacher_quality',
            'external_factors',
            'perceived_difficulty',
            'confidence',
          ],
          status: 'pending',
        });
      }
    }
  }

  return topics;
}

// ============================================================================
// TRANSITION DETECTION
// ============================================================================

function detectDifficultyTransitions(
  analysis: NuancedCapabilityAnalysis,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];
  const transitions = analysis.challengeResponse.transitionAnalysis.observedTransitions;

  for (const transition of transitions) {
    const beforeGrade = GPA_TO_GRADE(transition.gradeBefore);
    const afterGrade = GPA_TO_GRADE(transition.gradeAfter);
    const gradeChange = transition.gradeAfter - transition.gradeBefore;

    // Only create topics for notable transitions
    if (Math.abs(gradeChange) > 0.2 || transition.outcome === 'struggled') {
      const isPositive = gradeChange >= 0;
      const subject = formatSubject(transition.subject);

      topics.push({
        id: makeTopicId(),
        type: 'difficulty_transition',
        priority: transition.outcome === 'struggled' ? 9.5 : 7,
        scope: {
          subject: transition.subject as SubjectArea,
          timeframe: transition.year,
        },
        context: `Transitioned from ${transition.from} to ${transition.to} in ${subject}, grade went from ${beforeGrade} to ${afterGrade}`,
        primaryQuestion: isPositive
          ? `When you moved from ${formatLevel(transition.from)} to ${formatLevel(transition.to)} ${subject}, you actually did even better - ${beforeGrade} to ${afterGrade}. What was that experience like?`
          : transition.outcome === 'struggled'
            ? `Moving from ${formatLevel(transition.from)} to ${formatLevel(transition.to)} ${subject} looks like it was challenging - your grade went from ${beforeGrade} to ${afterGrade}. Can you tell me about that experience?`
            : `When you stepped up to ${formatLevel(transition.to)} ${subject}, your grade dipped a bit from ${beforeGrade} to ${afterGrade}. How did that transition feel?`,
        followUpQuestions: [
          'Was the jump in difficulty what you expected?',
          'How did you feel about the subject before vs after?',
          'Looking back, would you have done anything differently?',
          'How confident do you feel in this subject now?',
        ],
        targetInsights: [
          'transition_experience',
          'perceived_difficulty',
          'confidence',
          'self_assessment',
          'future_intent',
        ],
        status: 'pending',
      });
    }
  }

  return topics;
}

// ============================================================================
// HIGH-STAKES COURSE DETECTION
// ============================================================================

function detectHighStakesCourses(
  analysis: NuancedCapabilityAnalysis,
  intendedMajor: string,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];
  const relevantSubjects = getRelevantSubjects(intendedMajor);

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    if (!relevantSubjects.includes(subject as SubjectArea)) continue;

    // Find AP/IB courses in this subject
    const advancedCourses = pattern.performanceHistory.courses.filter(
      (c) => c.level.toLowerCase().includes('ap') || c.level.toLowerCase().includes('ib')
    );

    for (const course of advancedCourses) {
      const gradeStr = GPA_TO_GRADE(course.grade);
      const formattedSubject = formatSubject(subject);

      topics.push({
        id: makeTopicId(),
        type: 'high_stakes_course',
        priority: 8,
        scope: {
          course: course.name,
          subject: subject as SubjectArea,
        },
        context: `${course.name} is relevant to their intended ${intendedMajor} major`,
        primaryQuestion: `Since you're interested in ${intendedMajor}, I'd love to hear about your experience in ${course.name}. How was that class for you?`,
        followUpQuestions: [
          `Did ${course.name} affect your interest in ${intendedMajor}?`,
          'How confident do you feel in this area now?',
          'Do you see yourself continuing in this field?',
          'What was your favorite part of this class?',
        ],
        targetInsights: [
          'enjoyment',
          'engagement',
          'interest',
          'confidence',
          'future_intent',
        ],
        status: 'pending',
      });
    }
  }

  return topics;
}

// ============================================================================
// SUBJECT INCONSISTENCY DETECTION
// ============================================================================

function detectSubjectInconsistencies(
  analysis: NuancedCapabilityAnalysis,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    const courses = pattern.performanceHistory.courses;
    if (courses.length < 2) continue;

    const grades = courses.map((c) => c.grade);
    const spread = Math.max(...grades) - Math.min(...grades);

    // Wide grade spread within a subject
    if (spread > 0.7) {
      const bestGrade = GPA_TO_GRADE(Math.max(...grades));
      const worstGrade = GPA_TO_GRADE(Math.min(...grades));
      const formattedSubject = formatSubject(subject);

      topics.push({
        id: makeTopicId(),
        type: 'subject_inconsistency',
        priority: 6.5,
        scope: {
          subject: subject as SubjectArea,
        },
        context: `${formattedSubject} grades range from ${worstGrade} to ${bestGrade} - quite a spread`,
        primaryQuestion: `Your ${formattedSubject} grades have ranged from ${worstGrade} to ${bestGrade}. What accounts for that variation?`,
        followUpQuestions: [
          'Were some classes harder than others?',
          'Did teacher quality play a role?',
          'Were there semesters when other things were going on?',
          'Which classes did you enjoy more?',
        ],
        targetInsights: [
          'teacher_quality',
          'external_factors',
          'enjoyment',
          'perceived_difficulty',
          'self_assessment',
        ],
        status: 'pending',
      });
    }
  }

  return topics;
}

// ============================================================================
// TREND PATTERN DETECTION
// ============================================================================

function detectTrendPatterns(
  analysis: NuancedCapabilityAnalysis,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];
  const trajectory = analysis.progressionTrajectory.historical;

  // Overall GPA trend
  if (trajectory.overallTrend === 'declining') {
    topics.push({
      id: makeTopicId(),
      type: 'trend_exploration',
      priority: 9,
      scope: { global: true },
      context: 'Overall GPA shows a declining trend',
      primaryQuestion: `Your grades have been trending downward over time. Can you tell me what's been going on?`,
      followUpQuestions: [
        'Has something changed in your life?',
        'Are your courses getting harder?',
        'How are you feeling about school overall?',
        'Is there a specific subject or area where this is happening most?',
      ],
      targetInsights: [
        'external_factors',
        'motivation',
        'self_assessment',
        'engagement',
      ],
      status: 'pending',
    });
  } else if (trajectory.overallTrend === 'accelerating') {
    topics.push({
      id: makeTopicId(),
      type: 'trend_exploration',
      priority: 5,
      scope: { global: true },
      context: 'Overall GPA shows an accelerating improvement',
      primaryQuestion: `Your grades have been improving more and more over time - that's great! What do you think is driving that?`,
      followUpQuestions: [
        'Did something click for you?',
        'Have your study habits changed?',
        'Are you enjoying school more?',
      ],
      targetInsights: [
        'motivation',
        'learning_style',
        'self_assessment',
      ],
      status: 'pending',
    });
  }

  // Subject-specific trends
  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    if (pattern.performanceHistory.trend === 'declining') {
      const formattedSubject = formatSubject(subject);
      topics.push({
        id: makeTopicId(),
        type: 'trend_exploration',
        priority: 7.5,
        scope: {
          subject: subject as SubjectArea,
        },
        context: `${formattedSubject} grades show a declining trend`,
        primaryQuestion: `Your ${formattedSubject} grades have been declining over time. What's been happening there?`,
        followUpQuestions: [
          `Has your interest in ${formattedSubject} changed?`,
          'Are the courses getting harder?',
          'Is there something specific making it difficult?',
        ],
        targetInsights: [
          'interest',
          'external_factors',
          'confidence',
          'future_intent',
        ],
        status: 'pending',
      });
    }
  }

  return topics;
}

// ============================================================================
// SUBJECT OVERVIEW GENERATION
// ============================================================================

function generateSubjectOverviews(
  analysis: NuancedCapabilityAnalysis,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    const formattedSubject = formatSubject(subject);
    const avgGrade = GPA_TO_GRADE(pattern.performanceHistory.avgGPA);
    const isStrength = pattern.relativeStrength > 0.1;
    const isChallenge = pattern.relativeStrength < -0.1;

    topics.push({
      id: makeTopicId(),
      type: 'subject_overview',
      priority: 4, // Lower priority than specific issues
      scope: {
        subject: subject as SubjectArea,
      },
      context: `General exploration of their ${formattedSubject} experience`,
      primaryQuestion: isStrength
        ? `${formattedSubject} seems to be one of your stronger areas - you're averaging around ${avgGrade}. How do you feel about it?`
        : isChallenge
          ? `${formattedSubject} looks like it's been a bit more challenging for you. How do you feel about the subject?`
          : `Let's talk about ${formattedSubject}. How do you feel about it overall?`,
      followUpQuestions: [
        `Do you consider ${formattedSubject} a strength of yours?`,
        `How interested are you in ${formattedSubject}?`,
        `Do you want to continue taking ${formattedSubject} courses?`,
        `What's been your favorite ${formattedSubject} class so far?`,
      ],
      targetInsights: [
        'confidence',
        'interest',
        'future_intent',
        'self_assessment',
        'enjoyment',
      ],
      status: 'pending',
    });
  }

  return topics;
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function formatSubject(subject: string): string {
  const names: Record<string, string> = {
    math: 'Math',
    science: 'Science',
    english: 'English',
    social_studies: 'Social Studies',
    foreign_language: 'Foreign Language',
    arts: 'Arts',
    computer_science: 'Computer Science',
    other: 'other subjects',
  };
  return names[subject] || subject;
}

function formatLevel(level: string): string {
  if (level === 'ap_ib') return 'AP/IB';
  if (level === 'honors') return 'Honors';
  return 'regular';
}

function getRelevantSubjects(intendedMajor: string): SubjectArea[] {
  const majorLower = intendedMajor.toLowerCase();

  const relevanceMap: Record<string, SubjectArea[]> = {
    computer_science: ['math', 'science', 'computer_science'],
    engineering: ['math', 'science'],
    biology: ['science', 'math'],
    chemistry: ['science', 'math'],
    physics: ['science', 'math'],
    medicine: ['science', 'math'],
    business: ['math', 'social_studies'],
    economics: ['math', 'social_studies'],
    psychology: ['science', 'social_studies', 'math'],
    english: ['english'],
    history: ['social_studies', 'english'],
    political_science: ['social_studies', 'english'],
    art: ['arts'],
    music: ['arts'],
  };

  for (const [major, subjects] of Object.entries(relevanceMap)) {
    if (majorLower.includes(major) || major.includes(majorLower)) {
      return subjects;
    }
  }

  // Default - all subjects are somewhat relevant
  return ['math', 'science', 'english', 'social_studies'];
}

// ============================================================================
// TOPIC PRIORITIZATION
// ============================================================================

/**
 * Re-prioritize topics based on conversation context.
 * Call this after each turn to adjust priorities.
 */
export function reprioritizeTopics(
  topics: ConversationTopic[],
  context: {
    mentionedSubjects?: SubjectArea[];
    mentionedCourses?: string[];
    expressedConcerns?: string[];
    lastTopicType?: TopicType;
  }
): ConversationTopic[] {
  const adjusted = topics.map((topic) => {
    let priorityBoost = 0;

    // Boost priority if student mentioned this subject
    if (context.mentionedSubjects?.includes(topic.scope.subject!)) {
      priorityBoost += 2;
    }

    // Boost priority if student mentioned this course
    if (context.mentionedCourses?.some((c) =>
      topic.scope.course?.toLowerCase().includes(c.toLowerCase())
    )) {
      priorityBoost += 3;
    }

    // Vary topic types - don't ask the same type twice in a row
    if (topic.type === context.lastTopicType) {
      priorityBoost -= 1;
    }

    return {
      ...topic,
      priority: topic.priority + priorityBoost,
    };
  });

  return adjusted.sort((a, b) => b.priority - a.priority);
}

/**
 * Get the next topic to explore.
 */
export function getNextTopic(topics: ConversationTopic[]): ConversationTopic | null {
  const pending = topics.filter((t) => t.status === 'pending');
  if (pending.length === 0) return null;

  // Return highest priority pending topic
  return pending.sort((a, b) => b.priority - a.priority)[0];
}

/**
 * Mark a topic as completed with learnings.
 */
export function completeTopicWithLearnings(
  topic: ConversationTopic,
  learnings: string
): ConversationTopic {
  return {
    ...topic,
    status: 'completed',
    learningsSummary: learnings,
  };
}

// ============================================================================
// CROSS-SUBJECT PATTERN DETECTION
// ============================================================================

/**
 * Detect cross-subject patterns using heuristics first, then optionally LLM.
 * Returns patterns that span multiple subjects.
 */
export function detectCrossSubjectPatterns(
  analysis: NuancedCapabilityAnalysis,
  options: {
    useLLM?: boolean;
  } = {}
): CrossSubjectPattern[] {
  const patterns: CrossSubjectPattern[] = [];
  let patternId = 1;
  const makePatternId = () => `cross_${patternId++}`;

  // -------------------------------------------------------------------------
  // HEURISTIC DETECTION (Fast, no API needed)
  // -------------------------------------------------------------------------

  // 1. Detect sophomore slump (or any year where all subjects dipped)
  const yearlyPerformance = analyzeYearlyPerformance(analysis);
  for (const [year, data] of Object.entries(yearlyPerformance)) {
    if (data.avgChange < -0.3 && data.subjectsAffected >= 3) {
      const yearName = year === '10' ? 'Sophomore' : year === '11' ? 'Junior' : `Year ${year}`;
      patterns.push({
        id: makePatternId(),
        patternType: 'sophomore_slump',
        description: `${yearName} year shows decline across ${data.subjectsAffected} subjects (avg ${(data.avgChange * 100).toFixed(0)}% change)`,
        affectedSubjects: data.subjects,
        timeframe: yearName.toLowerCase() + ' year',
        confidence: Math.min(85, 60 + data.subjectsAffected * 8),
        significance: 'A widespread dip in one year often indicates external factors like life events, mental health challenges, or adjustment difficulties',
        suggestedQuestion: `I noticed ${yearName.toLowerCase()} year was tough across the board - your grades dipped in ${data.subjectsAffected} different subjects. What was going on that year?`,
        followUpQuestions: [
          'Was there something specific happening in your life then?',
          'How did you feel about school during that time?',
          'Did you have any support through it?',
        ],
        priority: 9.5,
      });
    }
  }

  // 2. Detect STEM vs Humanities divergence
  const stemSubjects: SubjectArea[] = ['math', 'science', 'computer_science'];
  const humanitiesSubjects: SubjectArea[] = ['english', 'social_studies', 'foreign_language', 'arts'];

  const stemPerformance = calculateGroupPerformance(analysis, stemSubjects);
  const humanitiesPerformance = calculateGroupPerformance(analysis, humanitiesSubjects);

  if (stemPerformance.trend !== humanitiesPerformance.trend &&
      (stemPerformance.trend !== 'stable' && humanitiesPerformance.trend !== 'stable')) {
    const stemGoing = stemPerformance.trend === 'improving' ? 'improving' : 'declining';
    const humanitiesGoing = humanitiesPerformance.trend === 'improving' ? 'improving' : 'declining';

    patterns.push({
      id: makePatternId(),
      patternType: 'stem_humanities_divergence',
      description: `STEM subjects are ${stemGoing} while humanities are ${humanitiesGoing}`,
      affectedSubjects: [...stemSubjects, ...humanitiesSubjects].filter(s =>
        analysis.subjectPatterns[s] !== undefined
      ) as SubjectArea[],
      confidence: 70,
      significance: 'This divergence often reveals where true interests lie versus where effort is being spent',
      suggestedQuestion: stemPerformance.trend === 'improving'
        ? `Your STEM subjects have been improving while your humanities grades have been going the other way. Is that something you've noticed? What do you think is driving that?`
        : `Your humanities are getting stronger while STEM has been more challenging. Are you finding yourself drawn more to one side?`,
      followUpQuestions: [
        'Which subjects do you actually enjoy more?',
        'Where do you see yourself spending time in the future?',
        'Has your effort distribution changed?',
      ],
      priority: 8,
    });
  }

  // 3. Detect universal difficulty ceiling (all AP/honors courses struggling)
  const advancedCoursePerformance = analyzeAdvancedCoursePerformance(analysis);
  if (advancedCoursePerformance.avgGrade < 3.0 && advancedCoursePerformance.courseCount >= 3) {
    patterns.push({
      id: makePatternId(),
      patternType: 'difficulty_ceiling',
      description: `Struggling in ${advancedCoursePerformance.courseCount} advanced courses (avg: ${GPA_TO_GRADE(advancedCoursePerformance.avgGrade)})`,
      affectedSubjects: advancedCoursePerformance.subjects,
      confidence: 75,
      significance: 'Consistent struggle across advanced courses might indicate pacing issues, workload management, or a need for different study strategies',
      suggestedQuestion: `I notice you've taken ${advancedCoursePerformance.courseCount} advanced courses and they've all been challenging. What's your experience been like with the increased difficulty?`,
      followUpQuestions: [
        'Do you feel like you have enough time for all your coursework?',
        'Have your study strategies changed as courses got harder?',
        'Would you say the struggle is about the material or about managing everything?',
      ],
      priority: 8.5,
    });
  }

  // 4. Detect recovery pattern (bad year followed by strong recovery)
  for (const [year, data] of Object.entries(yearlyPerformance)) {
    const nextYear = String(parseInt(year) + 1);
    if (yearlyPerformance[nextYear]) {
      const currentAvg = data.avgGPA;
      const nextAvg = yearlyPerformance[nextYear].avgGPA;
      if (data.avgChange < -0.2 && nextAvg - currentAvg > 0.3) {
        const yearName = year === '10' ? 'Sophomore' : year === '11' ? 'Junior' : `Year ${year}`;
        const nextYearName = nextYear === '11' ? 'Junior' : nextYear === '12' ? 'Senior' : `Year ${nextYear}`;
        patterns.push({
          id: makePatternId(),
          patternType: 'recovery_pattern',
          description: `Strong recovery in ${nextYearName} year after a dip in ${yearName} year`,
          affectedSubjects: data.subjects,
          timeframe: `${yearName.toLowerCase()} to ${nextYearName.toLowerCase()} year`,
          confidence: 80,
          significance: 'A strong recovery shows resilience and determination - this is a positive story',
          suggestedQuestion: `After a tough ${yearName.toLowerCase()} year, you really bounced back in ${nextYearName.toLowerCase()} year. What changed for you?`,
          followUpQuestions: [
            'What helped you turn things around?',
            'Did you approach things differently?',
            'How did that experience change you?',
          ],
          priority: 7,
        });
      }
    }
  }

  // 5. Detect external factor signature (multiple subjects affected in same timeframe)
  const subjectDips = findConcurrentDips(analysis);
  if (subjectDips.length >= 3) {
    patterns.push({
      id: makePatternId(),
      patternType: 'external_factor_signature',
      description: `${subjectDips.length} subjects show concurrent grade drops, suggesting a common external factor`,
      affectedSubjects: subjectDips.map(d => d.subject),
      timeframe: subjectDips[0].timeframe,
      confidence: 65,
      significance: 'When multiple unrelated subjects dip at once, it usually points to something outside academics affecting performance',
      suggestedQuestion: `I notice several of your subjects dipped around the same time. Was there something going on then that affected your studies overall?`,
      followUpQuestions: [
        'Were you dealing with anything challenging during that time?',
        'Did anything change in your personal life?',
        'How did you work through it?',
      ],
      priority: 9,
    });
  }

  return patterns.sort((a, b) => b.priority - a.priority);
}

/**
 * Detect cross-subject patterns using LLM for nuanced analysis.
 * This provides richer, more contextual pattern detection.
 */
export async function detectCrossSubjectPatternsWithLLM(
  analysis: NuancedCapabilityAnalysis,
  options: { intendedMajor?: string } = {}
): Promise<CrossSubjectPattern[]> {
  // First get heuristic patterns
  const heuristicPatterns = detectCrossSubjectPatterns(analysis);

  try {
    // Prepare analysis summary for LLM
    const analysisSum = summarizeAnalysisForLLM(analysis, options.intendedMajor);

    const systemPrompt = `You are an expert academic counselor analyzing a student's academic record to find cross-subject patterns.

Your job is to identify patterns that span MULTIPLE subjects - patterns that an isolated per-subject analysis would miss.

Look for:
1. Year-based patterns (e.g., "sophomore slump", recovery patterns)
2. Subject group patterns (e.g., STEM vs humanities divergence)
3. External factor signatures (multiple subjects affected simultaneously)
4. Interest/effort shifts (one area improving as another declines)
5. Workload impact patterns (adding APs correlates with declines elsewhere)
6. Hidden strengths (one subject consistently strong despite challenges)

Be conservative - only report patterns you're confident about.`;

    const prompt = `Analyze this student's academic record for cross-subject patterns:

${analysisSum}

${heuristicPatterns.length > 0 ? `
I've already detected these patterns using heuristics:
${heuristicPatterns.map(p => `- ${p.patternType}: ${p.description}`).join('\n')}

Look for ADDITIONAL patterns I might have missed, or provide more nuanced interpretations of the existing ones.
` : ''}

Return a JSON array of detected patterns:
[
  {
    "patternType": "one of: sophomore_slump | stem_humanities_divergence | universal_decline | universal_improvement | workload_impact | single_subject_anchor | difficulty_ceiling | recovery_pattern | external_factor_signature | interest_cluster",
    "description": "Clear description of the pattern",
    "affectedSubjects": ["subject1", "subject2"],
    "timeframe": "when this occurred (optional)",
    "confidence": 0-100,
    "significance": "Why this matters for understanding the student",
    "suggestedQuestion": "A natural, conversational question to ask about this",
    "followUpQuestions": ["follow up 1", "follow up 2"],
    "priority": 1-10
  }
]

Only return valid JSON, no other text.`;

    const response = await callClaude({
      model: 'claude-haiku-4-5-20251001',
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
      maxTokens: 2000,
      temperature: 0.2,
    });

    const jsonMatch = response.content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const llmPatterns = JSON.parse(jsonMatch[0]) as CrossSubjectPattern[];

      // Assign IDs to LLM patterns
      let llmId = heuristicPatterns.length + 1;
      for (const pattern of llmPatterns) {
        pattern.id = `cross_llm_${llmId++}`;
      }

      // Merge, preferring LLM interpretations for overlapping patterns
      const merged = mergePatterns(heuristicPatterns, llmPatterns);
      return merged.sort((a, b) => b.priority - a.priority);
    }
  } catch (error) {
    console.warn('[TopicDetector] LLM cross-subject detection failed, using heuristics only:', error);
  }

  return heuristicPatterns;
}

/**
 * Convert cross-subject patterns to conversation topics.
 */
export function crossSubjectPatternsToTopics(
  patterns: CrossSubjectPattern[],
  makeTopicId: () => string
): ConversationTopic[] {
  return patterns.map(pattern => ({
    id: makeTopicId(),
    type: 'circumstance_exploration' as TopicType,
    priority: pattern.priority,
    scope: {
      global: pattern.affectedSubjects.length > 2,
      subject: pattern.affectedSubjects.length === 1 ? pattern.affectedSubjects[0] : undefined,
      timeframe: pattern.timeframe,
    },
    context: pattern.description,
    primaryQuestion: pattern.suggestedQuestion,
    followUpQuestions: pattern.followUpQuestions,
    targetInsights: [
      'external_factors',
      'motivation',
      'self_assessment',
      'engagement',
    ] as TargetInsight[],
    status: 'pending',
    metadata: {
      crossSubjectPatternId: pattern.id,
      crossSubjectPatternType: pattern.patternType,
    },
  }));
}

// ============================================================================
// CROSS-SUBJECT HELPER FUNCTIONS
// ============================================================================

interface YearlyData {
  avgGPA: number;
  avgChange: number;
  subjectsAffected: number;
  subjects: SubjectArea[];
}

function analyzeYearlyPerformance(
  analysis: NuancedCapabilityAnalysis
): Record<string, YearlyData> {
  const yearlyData: Record<string, { gpas: number[]; subjects: SubjectArea[] }> = {};

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      const year = String(course.year);
      if (!yearlyData[year]) {
        yearlyData[year] = { gpas: [], subjects: [] };
      }
      yearlyData[year].gpas.push(course.grade);
      if (!yearlyData[year].subjects.includes(subject as SubjectArea)) {
        yearlyData[year].subjects.push(subject as SubjectArea);
      }
    }
  }

  const result: Record<string, YearlyData> = {};
  const years = Object.keys(yearlyData).sort((a, b) => parseInt(a) - parseInt(b));

  for (let i = 0; i < years.length; i++) {
    const year = years[i];
    const data = yearlyData[year];
    const avgGPA = data.gpas.reduce((a, b) => a + b, 0) / data.gpas.length;

    let avgChange = 0;
    if (i > 0) {
      const prevYear = years[i - 1];
      const prevAvg = yearlyData[prevYear].gpas.reduce((a, b) => a + b, 0) / yearlyData[prevYear].gpas.length;
      avgChange = avgGPA - prevAvg;
    }

    result[year] = {
      avgGPA,
      avgChange,
      subjectsAffected: data.subjects.length,
      subjects: data.subjects,
    };
  }

  return result;
}

interface GroupPerformance {
  avgGPA: number;
  trend: 'improving' | 'declining' | 'stable';
  subjectCount: number;
}

function calculateGroupPerformance(
  analysis: NuancedCapabilityAnalysis,
  subjects: SubjectArea[]
): GroupPerformance {
  const gpas: number[] = [];
  const trends: string[] = [];

  for (const subject of subjects) {
    const pattern = analysis.subjectPatterns[subject];
    if (pattern) {
      gpas.push(pattern.performanceHistory.avgGPA);
      trends.push(pattern.performanceHistory.trend);
    }
  }

  if (gpas.length === 0) {
    return { avgGPA: 0, trend: 'stable', subjectCount: 0 };
  }

  const avgGPA = gpas.reduce((a, b) => a + b, 0) / gpas.length;
  const improvingCount = trends.filter(t => t === 'improving').length;
  const decliningCount = trends.filter(t => t === 'declining').length;

  let trend: 'improving' | 'declining' | 'stable' = 'stable';
  if (improvingCount > decliningCount && improvingCount > gpas.length / 2) {
    trend = 'improving';
  } else if (decliningCount > improvingCount && decliningCount > gpas.length / 2) {
    trend = 'declining';
  }

  return { avgGPA, trend, subjectCount: gpas.length };
}

interface AdvancedCoursePerformance {
  avgGrade: number;
  courseCount: number;
  subjects: SubjectArea[];
}

function analyzeAdvancedCoursePerformance(
  analysis: NuancedCapabilityAnalysis
): AdvancedCoursePerformance {
  const grades: number[] = [];
  const subjects: SubjectArea[] = [];

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    for (const course of pattern.performanceHistory.courses) {
      const level = course.level.toLowerCase();
      if (level.includes('ap') || level.includes('ib') || level.includes('honors')) {
        grades.push(course.grade);
        if (!subjects.includes(subject as SubjectArea)) {
          subjects.push(subject as SubjectArea);
        }
      }
    }
  }

  return {
    avgGrade: grades.length > 0 ? grades.reduce((a, b) => a + b, 0) / grades.length : 4.0,
    courseCount: grades.length,
    subjects,
  };
}

interface SubjectDip {
  subject: SubjectArea;
  timeframe: string;
  magnitude: number;
}

function findConcurrentDips(analysis: NuancedCapabilityAnalysis): SubjectDip[] {
  const dips: SubjectDip[] = [];

  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    const courses = pattern.performanceHistory.courses;
    for (let i = 1; i < courses.length; i++) {
      const change = courses[i].grade - courses[i - 1].grade;
      if (change < -0.5) {
        dips.push({
          subject: subject as SubjectArea,
          timeframe: String(courses[i].year),
          magnitude: Math.abs(change),
        });
      }
    }
  }

  // Find concurrent dips (same timeframe)
  const timeframeCounts: Record<string, SubjectDip[]> = {};
  for (const dip of dips) {
    if (!timeframeCounts[dip.timeframe]) {
      timeframeCounts[dip.timeframe] = [];
    }
    timeframeCounts[dip.timeframe].push(dip);
  }

  // Return the most concurrent dips
  const mostConcurrent = Object.values(timeframeCounts)
    .sort((a, b) => b.length - a.length)[0];

  return mostConcurrent || [];
}

function summarizeAnalysisForLLM(
  analysis: NuancedCapabilityAnalysis,
  intendedMajor?: string
): string {
  const lines: string[] = [];

  if (intendedMajor) {
    lines.push(`Intended major: ${intendedMajor}`);
  }

  lines.push('\nSubject Performance Summary:');
  for (const [subject, pattern] of Object.entries(analysis.subjectPatterns)) {
    const courses = pattern.performanceHistory.courses
      .map(c => `${c.name} (${c.level}, Year ${c.year}): ${GPA_TO_GRADE(c.grade)}`)
      .join(', ');
    lines.push(`- ${formatSubject(subject)}: Avg ${GPA_TO_GRADE(pattern.performanceHistory.avgGPA)}, Trend: ${pattern.performanceHistory.trend}`);
    lines.push(`  Courses: ${courses}`);
  }

  lines.push(`\nOverall Trajectory: ${analysis.progressionTrajectory.historical.overallTrend}`);

  return lines.join('\n');
}

function mergePatterns(
  heuristicPatterns: CrossSubjectPattern[],
  llmPatterns: CrossSubjectPattern[]
): CrossSubjectPattern[] {
  const merged: CrossSubjectPattern[] = [];
  const usedLLMIds = new Set<string>();

  for (const hp of heuristicPatterns) {
    // Find matching LLM pattern
    const matchingLLM = llmPatterns.find(lp =>
      lp.patternType === hp.patternType &&
      !usedLLMIds.has(lp.id)
    );

    if (matchingLLM) {
      // Use LLM's more nuanced interpretation but keep heuristic's confidence boost
      usedLLMIds.add(matchingLLM.id);
      merged.push({
        ...matchingLLM,
        confidence: Math.max(hp.confidence, matchingLLM.confidence),
        id: hp.id, // Keep original ID
      });
    } else {
      merged.push(hp);
    }
  }

  // Add LLM patterns that weren't matched
  for (const lp of llmPatterns) {
    if (!usedLLMIds.has(lp.id)) {
      merged.push(lp);
    }
  }

  return merged;
}

// ============================================================================
// REPORT-DERIVED TOPIC GENERATION
// ============================================================================

/**
 * Generate conversation topics from a deep academic report.
 * Each challenge becomes a topic, each roadmap priority becomes a topic,
 * and major alignment gaps create topics.
 *
 * These supplement (not replace) the existing detectTopics() output.
 */
export function generateReportTopics(
  report: DeepAcademicReport,
  makeTopicId: () => string
): ConversationTopic[] {
  const topics: ConversationTopic[] = [];

  // 1. Each challenge becomes a conversation topic
  for (const challenge of report.challengesAndReality.challenges) {
    topics.push({
      id: makeTopicId(),
      type: 'subject_inconsistency',
      priority: 8, // High but below grade anomalies (9+)
      scope: {
        pattern: challenge.title,
      },
      context: `Deep report challenge: ${challenge.title}`,
      primaryQuestion: `Your academic report flagged "${challenge.title}" as something worth discussing. ${challenge.issue.split('.')[0]}. Can you tell me more about what's been happening there?`,
      followUpQuestions: [
        `How do you feel about this area?`,
        `Have you thought about how to address this?`,
        `Is this something you've noticed yourself?`,
      ],
      targetInsights: [
        'self_assessment',
        'external_factors',
        'confidence',
        'future_intent',
      ],
      status: 'pending',
    });
  }

  // 2. Each roadmap priority becomes a future_planning topic
  for (const priority of report.strategicRoadmap.priorities) {
    topics.push({
      id: makeTopicId(),
      type: 'future_planning',
      priority: 7 + (priority.impact === 'critical' ? 1.5 : priority.impact === 'high' ? 1 : 0),
      scope: {
        pattern: priority.title,
      },
      context: `Roadmap priority #${priority.priority}: ${priority.title}`,
      primaryQuestion: `One recommendation from your report is to ${priority.actionItems[0]?.toLowerCase() || priority.description.toLowerCase()}. How does that sound to you?`,
      followUpQuestions: [
        `Is this something you'd be interested in pursuing?`,
        `What concerns do you have about this?`,
        `How does this fit with your other plans?`,
      ],
      targetInsights: [
        'future_intent',
        'interest',
        'confidence',
        'self_assessment',
      ],
      status: 'pending',
    });
  }

  // 3. Major alignment gaps become high_stakes_course topics
  const ma = report.strategicRoadmap.majorAlignment;
  if (ma.missingPieces.length > 0 && ma.score < 70) {
    topics.push({
      id: makeTopicId(),
      type: 'high_stakes_course',
      priority: 8.5,
      scope: {
        pattern: 'major_alignment_gap',
      },
      context: `Major alignment score: ${ma.score}/100 — missing: ${ma.missingPieces.join(', ')}`,
      primaryQuestion: `Your report shows some gaps in courses that would strengthen your major alignment. For example, ${ma.missingPieces[0]} is something that could help. Have you considered courses in that area?`,
      followUpQuestions: [
        `What's holding you back from taking those courses?`,
        `How confident do you feel about your major choice?`,
        `Are there related courses you've enjoyed?`,
      ],
      targetInsights: [
        'future_intent',
        'confidence',
        'interest',
        'perceived_difficulty',
      ],
      status: 'pending',
    });
  }

  // 4. Course recommendations that might be surprising
  for (const rec of report.strategicRoadmap.courseStrategy.recommended) {
    if (rec.risk === 'high') {
      topics.push({
        id: makeTopicId(),
        type: 'difficulty_transition',
        priority: 7,
        scope: {
          course: rec.course,
        },
        context: `High-risk course recommendation: ${rec.course}`,
        primaryQuestion: `Your report recommends considering ${rec.course}, but notes it could be challenging. What are your thoughts on taking that course?`,
        followUpQuestions: [
          `Do you feel prepared for that level of difficulty?`,
          `What would help you succeed in that course?`,
        ],
        targetInsights: [
          'confidence',
          'perceived_difficulty',
          'future_intent',
          'self_assessment',
        ],
        status: 'pending',
      });
    }
  }

  return topics;
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  formatSubject,
  formatLevel,
  getRelevantSubjects,
};
