// @ts-nocheck
/**
 * Context Gap Detector
 *
 * **Detects where the suggestion engine would need to INVENT details**
 *
 * This service analyzes essays and detected issues to find "context gaps" -
 * places where we lack the student's real experience and would have to
 * fabricate details. Instead of inventing, we signal the chat interface
 * to gather this context from the student.
 *
 * **Key Principle**: It's better to ask than to invent.
 *
 * A performative phrase like "Not for a class—just because her methodology
 * blew my mind" is often a context gap in disguise. The student knows they're
 * supposed to show passion, but they haven't surfaced the specific details
 * that would actually demonstrate it.
 *
 * **Usage**:
 * 1. Call detectContextGaps() before generating suggestions
 * 2. If critical gaps found, return a ContextGatheringRequest
 * 3. Chat interface asks the questions
 * 4. Feed EnrichedStudentContext back to suggestion generation
 */

import type {
  ContextGap,
  ContextGapType,
  ContextQuestion,
  ContextGatheringRequest,
  EnrichedStudentContext,
  createContextGap,
  createContextQuestion,
} from '../types/contextGathering';
import type { IssueContext } from './typeSpecificSuggestionService';
import type { SupplementalType } from '../../../data/commonAppSupplementalTypes';

// ============================================================================
// CONTEXT GAP PATTERNS
// ============================================================================

/**
 * Patterns that indicate a context gap exists
 * These are phrases students use when they don't have the concrete details
 */
const CONTEXT_GAP_INDICATORS: {
  pattern: RegExp;
  gap_type: ContextGapType;
  description: string;
}[] = [
  // Missing specific moments
  {
    pattern: /(?:when I|after I|once I)\s+(?:discovered|realized|learned|found|saw)/i,
    gap_type: 'missing_specific_moment',
    description: 'Claims a discovery moment without describing it concretely'
  },
  {
    pattern: /(?:my experience|this experience|that experience)\s+(?:taught|showed|made)/i,
    gap_type: 'missing_specific_moment',
    description: 'References "an experience" without naming specific details'
  },
  {
    pattern: /I (?:began|started) to (?:understand|realize|see|appreciate)/i,
    gap_type: 'missing_specific_insight',
    description: 'Claims gradual realization without the moment of insight'
  },

  // Missing sensory/concrete details
  {
    pattern: /(?:it was|was very|really was)\s+(?:amazing|incredible|life-changing|transformative|eye-opening)/i,
    gap_type: 'missing_sensory_detail',
    description: 'Uses adjective instead of showing what made it remarkable'
  },
  {
    pattern: /I (?:loved|enjoyed|appreciated|was fascinated by)\s+(?:how|the way|that)/i,
    gap_type: 'missing_sensory_detail',
    description: 'States attraction without showing what specifically appealed'
  },

  // Missing emotional context
  {
    pattern: /I felt\s+(?:like|that|as if|so)/i,
    gap_type: 'missing_emotional_reaction',
    description: 'States feeling abstractly instead of showing the sensation'
  },
  {
    pattern: /(?:deeply|profoundly|truly)\s+(?:moved|affected|impacted|touched)/i,
    gap_type: 'missing_emotional_reaction',
    description: 'Uses intensity adverb instead of describing the reaction'
  },

  // Missing insight specifics
  {
    pattern: /I (?:realized|discovered|learned|understood)\s+(?:that|how|why)/i,
    gap_type: 'missing_specific_insight',
    description: 'Claims realization without what specifically changed in understanding'
  },
  {
    pattern: /it (?:taught|showed|made)\s+me\s+(?:that|how|to)/i,
    gap_type: 'missing_specific_insight',
    description: 'Attributes teaching to "it" without specific insight'
  },
  {
    pattern: /opened my eyes to/i,
    gap_type: 'missing_specific_insight',
    description: 'Cliché claiming revelation without substance'
  },

  // Missing personal stake
  {
    pattern: /I (?:want|hope|aspire)\s+to\s+(?:make|create|build|help|change)/i,
    gap_type: 'missing_personal_stake',
    description: 'States goal without why they specifically care'
  },
  {
    pattern: /(?:passionate|interested|excited)\s+(?:about|in|by)/i,
    gap_type: 'missing_personal_stake',
    description: 'Claims passion without demonstrating personal connection'
  },
  {
    pattern: /(?:my passion|this passion|a passion)\s+for/i,
    gap_type: 'missing_personal_stake',
    description: 'Declares passion as fact without evidence'
  },

  // Missing research depth
  {
    pattern: /(?:research|work|studies)\s+(?:on|in|about)\s+[^.]{10,50}(?:interested|fascinated|inspired)/i,
    gap_type: 'missing_research_depth',
    description: 'Mentions research area with generic interest claim'
  },
  {
    pattern: /Professor\s+[A-Z][a-z]+(?:'s)?\s+(?:work|research)\s+(?:on|in)/i,
    gap_type: 'missing_research_depth',
    description: 'Name-drops professor without showing understanding'
  },

  // Missing limitation/failure
  {
    pattern: /(?:at first|initially|in the beginning)\s+[^.]+(?:but then|however|eventually)/i,
    gap_type: 'missing_failed_attempt',
    description: 'Implies difficulty without describing the struggle'
  },
  {
    pattern: /(?:challenge|difficult|hard|struggle)\s+(?:but|and)\s+(?:eventually|finally|ultimately)/i,
    gap_type: 'missing_failed_attempt',
    description: 'Mentions challenge then skips to resolution'
  },

  // Missing contradiction/synthesis
  {
    pattern: /I (?:never|hadn't)\s+(?:expected|thought|imagined|considered)/i,
    gap_type: 'missing_contradiction_faced',
    description: 'Claims surprise without what specifically contradicted expectation'
  },
  {
    pattern: /(?:connecting|combining|merging)\s+(?:my|these|both)/i,
    gap_type: 'missing_synthesis',
    description: 'Claims synthesis without showing the actual connection'
  },

  // Missing person details
  {
    pattern: /(?:my|a)\s+(?:mentor|teacher|coach|professor|advisor)\s+(?:who|that)/i,
    gap_type: 'missing_person_detail',
    description: 'References mentor role without memorable details'
  },
  {
    pattern: /(?:my grandmother|my grandfather|my mother|my father|my parent)/i,
    gap_type: 'missing_person_detail',
    description: 'Mentions family member - need specific memorable moments'
  },

  // Performative authenticity patterns (these are almost always context gaps)
  {
    pattern: /not for (?:a class|school|credit|grade)/i,
    gap_type: 'missing_personal_stake',
    description: 'Claims self-direction without showing what drove it'
  },
  {
    pattern: /on my own (?:time|initiative|volition)/i,
    gap_type: 'missing_personal_stake',
    description: 'Claims autonomy without the specific motivation'
  },
  {
    pattern: /(?:blew|changed|transformed)\s+my\s+(?:mind|life|perspective)/i,
    gap_type: 'missing_specific_insight',
    description: 'Claims transformation without the before/after'
  },
  {
    pattern: /sparked (?:my|a)\s+(?:passion|interest|curiosity)/i,
    gap_type: 'missing_specific_moment',
    description: 'Claims spark without the specific moment'
  },
];

// ============================================================================
// TYPE-SPECIFIC GAP PRIORITIES
// ============================================================================

/**
 * Which context gaps matter most for each essay type
 */
const TYPE_CRITICAL_GAPS: Record<SupplementalType, ContextGapType[]> = {
  why_us: [
    'missing_research_depth',
    'missing_specific_insight',
    'missing_personal_stake',
  ],
  why_major: [
    'missing_specific_moment',
    'missing_limitation_discovered',
    'missing_thought_process',
  ],
  community: [
    'missing_specific_moment',
    'missing_person_detail',
    'missing_consequence',
  ],
  diversity: [
    'missing_specific_moment',
    'missing_emotional_reaction',
    'missing_unique_angle',
  ],
  intellectual: [
    'missing_limitation_discovered',
    'missing_contradiction_faced',
    'missing_synthesis',
  ],
  extracurricular: [
    'missing_specific_moment',
    'missing_failed_attempt',
    'missing_consequence',
  ],
  challenge: [
    'missing_failed_attempt',
    'missing_emotional_reaction',
    'missing_thought_process',
  ],
  leadership: [
    'missing_specific_moment',
    'missing_dialogue',
    'missing_consequence',
  ],
  creative: [
    'missing_thought_process',
    'missing_failed_attempt',
    'missing_unique_angle',
  ],
  values: [
    'missing_specific_moment',
    'missing_contradiction_faced',
    'missing_consequence',
  ],
  future_goals: [
    'missing_personal_stake',
    'missing_specific_insight',
    'missing_ongoing_relevance',
  ],
  additional_info: [
    'missing_specific_moment',
    'missing_consequence',
  ],
  short_answer: [
    'missing_specific_moment',
    'missing_sensory_detail',
  ],
  optional: [
    'missing_unique_angle',
    'missing_personal_stake',
  ],
};

// ============================================================================
// QUESTION TEMPLATES
// ============================================================================

/**
 * Question templates for each gap type
 * These are designed to extract concrete, usable context
 */
const GAP_QUESTION_TEMPLATES: Record<ContextGapType, {
  questions: string[];
  follow_up_shallow: string;
  follow_up_abstract: string;
  example_weak: string;
  example_strong: string;
}> = {
  missing_specific_moment: {
    questions: [
      'Take me to the exact moment. Where were you? What time was it? What were you doing right before?',
      'If I were watching a video of this moment, what would I see you doing?',
      'What did you notice first? What caught your attention?'
    ],
    follow_up_shallow: 'Can you slow down that moment? What did it look like, sound like, feel like?',
    follow_up_abstract: 'I need to see this like a scene in a movie. What would the camera show?',
    example_weak: 'I had a breakthrough while working on the project',
    example_strong: 'I was sitting on my bedroom floor at 11pm, laptop balanced on a textbook, when the terminal finally showed all green'
  },
  missing_sensory_detail: {
    questions: [
      'What did you see, hear, or feel in that moment?',
      'If you close your eyes and go back there, what comes first—a sound, a smell, something you saw?',
      'What would someone standing next to you have noticed?'
    ],
    follow_up_shallow: 'Get more specific—was it loud or quiet? Bright or dim? Crowded or empty?',
    follow_up_abstract: 'Less about what it meant, more about what you actually perceived',
    example_weak: 'The environment was very stimulating',
    example_strong: 'The lab smelled like burned coffee and solder. Three monitors glowed blue in the dark corner.'
  },
  missing_emotional_reaction: {
    questions: [
      'What did your body do in that moment? Did your chest tighten? Did you hold your breath?',
      'What was the first thing you wanted to do after it happened?',
      'Where in your body did you feel it?'
    ],
    follow_up_shallow: 'Don\'t tell me you were "excited"—tell me what excited felt like in that moment',
    follow_up_abstract: 'Skip the label. What physical sensation did you have?',
    example_weak: 'I was really excited and happy',
    example_strong: 'I couldn\'t sit still. I paced my room three times before I could even text my friend.'
  },
  missing_thought_process: {
    questions: [
      'Walk me through your thinking. What question were you asking yourself?',
      'What was your first hypothesis? What made you doubt it?',
      'What did you try that didn\'t work, and what did that teach you?'
    ],
    follow_up_shallow: 'I want to see your brain working. What were you considering? What did you reject?',
    follow_up_abstract: 'Less about the conclusion, more about how you got there',
    example_weak: 'I figured out the solution',
    example_strong: 'First I tried A, which broke B. So I googled the error, found a Stack Overflow post from 2019, and realized I was thinking about the problem backwards.'
  },
  missing_dialogue: {
    questions: [
      'What did they actually say? Even if you don\'t remember exactly, what was the gist?',
      'How did they say it? Were they excited, hesitant, matter-of-fact?',
      'What did you say back? What couldn\'t you say?'
    ],
    follow_up_shallow: 'Try to hear their voice. How would they phrase it?',
    follow_up_abstract: 'Give me their words, not a summary of the conversation',
    example_weak: 'My mentor encouraged me to keep going',
    example_strong: 'She said, "You know this isn\'t working, right?" I nodded. "Good. Now what are you going to do about it?"'
  },
  missing_specific_insight: {
    questions: [
      'Before this, what did you think was true? And what do you think now?',
      'What would you tell your past self that they wouldn\'t believe?',
      'What question can you now answer that you couldn\'t before?'
    ],
    follow_up_shallow: 'Don\'t just say you "learned" something. What specifically changed in how you see it?',
    follow_up_abstract: 'Make it concrete. Give me a before and after.',
    example_weak: 'I learned that persistence is important',
    example_strong: 'I thought the hard part was writing the code. Turns out the hard part is knowing which code to delete.'
  },
  missing_limitation_discovered: {
    questions: [
      'Where did your approach hit a wall? What didn\'t work the way you expected?',
      'What assumption did you make that turned out to be wrong?',
      'If you could go back, what would you do differently and why?'
    ],
    follow_up_shallow: 'Get specific about the failure. What exactly went wrong?',
    follow_up_abstract: 'I don\'t want philosophy about failure. I want the actual thing that failed.',
    example_weak: 'I encountered some challenges along the way',
    example_strong: 'My model had 96% training accuracy and 43% test accuracy. I\'d overfit it so badly it was basically memorizing.'
  },
  missing_contradiction_faced: {
    questions: [
      'What surprised you? What didn\'t fit what you expected?',
      'When did you think "wait, that doesn\'t make sense"?',
      'What two things seemed true but contradicted each other?'
    ],
    follow_up_shallow: 'Dig into the surprise. What exactly contradicted what?',
    follow_up_abstract: 'Give me the specific thing that didn\'t fit your mental model',
    example_weak: 'It challenged my assumptions',
    example_strong: 'The most effective shelters had fewer rules, not more. That didn\'t match anything I\'d read about structure and stability.'
  },
  missing_synthesis: {
    questions: [
      'When did you see these two things connect? What made you realize they were related?',
      'What\'s an idea you have that combines things that usually don\'t go together?',
      'If you had to explain your unique angle in one sentence, what would it be?'
    ],
    follow_up_shallow: 'Show me the connection. How do these ideas actually relate?',
    follow_up_abstract: 'Don\'t just name the fields. Show how they informed each other.',
    example_weak: 'I combine computer science and music',
    example_strong: 'Debugging taught me to listen to Bach differently—I started hearing the modular architecture, the function calls between voices.'
  },
  missing_personal_stake: {
    questions: [
      'Why do YOU care about this? Not why anyone would care—why you specifically?',
      'What happened in your life that made this matter to you?',
      'What would be lost if you stopped doing this?'
    ],
    follow_up_shallow: 'Dig deeper than "I find it interesting." What\'s the personal connection?',
    follow_up_abstract: 'I need your specific story, not a general reason why this matters',
    example_weak: 'I\'m passionate about environmental issues',
    example_strong: 'My grandmother can\'t swim in her childhood lake anymore. It\'s too polluted. She talks about it every summer.'
  },
  missing_consequence: {
    questions: [
      'What changed after this? What do you do differently now?',
      'What happened as a result? Not what you learned—what actually changed?',
      'How can I tell this mattered? What\'s different in your life?'
    ],
    follow_up_shallow: 'Trace the ripple effect. What concrete thing is different now?',
    follow_up_abstract: 'Less reflection, more tangible change',
    example_weak: 'It had a big impact on me',
    example_strong: 'Now I volunteer at the clinic every Thursday. I\'ve gone 47 weeks straight.'
  },
  missing_ongoing_relevance: {
    questions: [
      'How does this still show up in your life today?',
      'What do you do now that connects back to this?',
      'When did this come up recently? Give me a recent example.'
    ],
    follow_up_shallow: 'Give me a specific recent moment where this mattered',
    follow_up_abstract: 'Don\'t tell me it\'s still relevant. Show me when it last came up.',
    example_weak: 'This experience continues to influence me',
    example_strong: 'Last week I caught myself using the same troubleshooting method on my calculus homework.'
  },
  missing_research_depth: {
    questions: [
      'What specifically interested you about this work? What detail or idea stuck with you?',
      'What question does this research try to answer? What\'s their approach?',
      'What\'s something about this that most people wouldn\'t know?'
    ],
    follow_up_shallow: 'Go deeper than the abstract. What made this stand out from other research?',
    follow_up_abstract: 'Don\'t describe the field. Tell me about this specific work.',
    example_weak: 'Her research on AI is really interesting',
    example_strong: 'Her lab trains models on unlabeled medical images, then fine-tunes on just 50 labeled examples. That efficiency is what caught my attention.'
  },
  missing_unique_angle: {
    questions: [
      'What do you notice about this that others might miss?',
      'What question do you ask that others in your position might not think to ask?',
      'What\'s a connection you make that might surprise people?'
    ],
    follow_up_shallow: 'Push past the obvious. What\'s YOUR specific lens?',
    follow_up_abstract: 'Don\'t tell me you\'re unique. Show me the unique thought.',
    example_weak: 'I bring a unique perspective',
    example_strong: 'Most people see a homeless person and think "addiction" or "mental illness." I see someone who probably missed one rent check three years ago.'
  },
  missing_failed_attempt: {
    questions: [
      'What did you try first that didn\'t work?',
      'Walk me through a time you messed up. What happened?',
      'What\'s a version of this you\'d be embarrassed to show me now?'
    ],
    follow_up_shallow: 'Get specific about the failure. What exactly went wrong?',
    follow_up_abstract: 'I want the actual mistake, not a polished lesson',
    example_weak: 'There were bumps along the way',
    example_strong: 'My first prototype caught fire. Literally. Small fire. I forgot to add a resistor.'
  },
  missing_person_detail: {
    questions: [
      'Give me one detail about this person that captures who they are.',
      'What\'s something they said or did that you\'ll never forget?',
      'How would you recognize them in a crowd?'
    ],
    follow_up_shallow: 'Skip the role description. Give me a memorable detail.',
    follow_up_abstract: 'Don\'t tell me they\'re inspiring. Show me the moment that inspired you.',
    example_weak: 'My mentor is an amazing person',
    example_strong: 'She keeps a rubber duck on her desk. Says she explains bugs to it before asking anyone for help.'
  },
  missing_relationship_dynamic: {
    questions: [
      'What\'s a typical interaction between you two like?',
      'How do they push you? What do they call you out on?',
      'What do they do that annoys you? (Honestly.)'
    ],
    follow_up_shallow: 'Show me how you actually talk to each other',
    follow_up_abstract: 'Less about what they mean to you, more about how you interact',
    example_weak: 'We have a great relationship',
    example_strong: 'She texts me "did you eat today" around 2pm every day. I lie sometimes. She knows.'
  }
};

// ============================================================================
// MAIN SERVICE CLASS
// ============================================================================

export class ContextGapDetector {
  /**
   * Detect context gaps in an essay based on the issues found
   *
   * @param essayDraft The essay text
   * @param essayType The type of essay
   * @param issues The issues detected in scoring
   * @returns List of detected context gaps
   */
  detectGaps(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[]
  ): ContextGap[] {
    const gaps: ContextGap[] = [];
    const criticalGapTypes = TYPE_CRITICAL_GAPS[essayType] || [];

    // 1. Check for pattern-based gaps in the essay text
    for (const indicator of CONTEXT_GAP_INDICATORS) {
      const matches = essayDraft.match(indicator.pattern);
      if (matches) {
        // Find the paragraph number
        const beforeMatch = essayDraft.substring(0, essayDraft.indexOf(matches[0]));
        const paragraphNumber = (beforeMatch.match(/\n\n/g) || []).length + 1;

        // Determine priority based on essay type
        const isCritical = criticalGapTypes.includes(indicator.gap_type);

        gaps.push({
          gap_id: `gap_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          gap_type: indicator.gap_type,
          location: {
            quote: matches[0],
            paragraph: paragraphNumber
          },
          diagnosis: {
            what_is_missing: indicator.description,
            why_it_matters: this.getWhyItMatters(indicator.gap_type),
            what_would_fix_it: this.getWhatWouldFixIt(indicator.gap_type)
          },
          priority: isCritical ? 'critical' : this.getDefaultPriority(indicator.gap_type),
          difficulty: this.getDifficulty(indicator.gap_type)
        });
      }
    }

    // 2. Check issue diagnosis for gap indicators
    for (const issue of issues) {
      const symptomType = issue.diagnosis.symptom_type.toLowerCase();
      const problem = issue.diagnosis.problem.toLowerCase();

      // Map symptoms to gap types
      if (symptomType.includes('performative') || symptomType.includes('cliche')) {
        const gapType = this.inferGapTypeFromIssue(issue, essayType);
        if (gapType && !gaps.some(g => g.location.quote === issue.quote)) {
          const isCritical = criticalGapTypes.includes(gapType);
          gaps.push({
            gap_id: `gap_issue_${issue.issue_id}`,
            gap_type: gapType,
            location: {
              quote: issue.quote,
              paragraph: this.getParagraphNumber(essayDraft, issue.quote)
            },
            diagnosis: {
              what_is_missing: issue.diagnosis.problem,
              why_it_matters: this.getWhyItMatters(gapType),
              what_would_fix_it: this.getWhatWouldFixIt(gapType)
            },
            priority: isCritical ? 'critical' : 'high',
            difficulty: this.getDifficulty(gapType)
          });
        }
      }
    }

    // 3. Deduplicate and sort by priority
    const uniqueGaps = this.deduplicateGaps(gaps);
    return this.sortGapsByPriority(uniqueGaps);
  }

  /**
   * Create a context gathering request from detected gaps
   *
   * @param issueContext The issue that needs more context
   * @param gaps The detected gaps
   * @param maxQuestions Maximum questions to include
   * @returns A context gathering request for the chat interface
   */
  createGatheringRequest(
    issueContext: IssueContext,
    gaps: ContextGap[],
    maxQuestions: number = 3
  ): ContextGatheringRequest {
    // Select the most important gaps
    const selectedGaps = gaps.slice(0, maxQuestions);

    // Generate questions for each gap
    const questions: ContextQuestion[] = selectedGaps.map(gap => {
      const template = GAP_QUESTION_TEMPLATES[gap.gap_type];
      // Pick a question (could be randomized or based on context)
      const questionText = template.questions[0];

      return {
        question_id: `q_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        gap_id: gap.gap_id,
        gap_type: gap.gap_type,
        question: questionText,
        follow_up_if_shallow: template.follow_up_shallow,
        follow_up_if_abstract: template.follow_up_abstract,
        signs_of_good_answer: this.getSignsOfGoodAnswer(gap.gap_type),
        example_weak_answer: template.example_weak,
        example_strong_answer: template.example_strong,
        ideal_length: gap.difficulty === 'deep_reflection' ? 'paragraph' : 'few_sentences'
      };
    });

    // Estimate time based on difficulty
    const hasDeepQuestions = selectedGaps.some(g => g.difficulty === 'deep_reflection');
    const estimatedTime = hasDeepQuestions ? 'substantial' :
      selectedGaps.some(g => g.difficulty === 'moderate') ? 'moderate' : 'quick';

    return {
      request_id: `req_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      trigger: {
        issue_id: issueContext.issue_id,
        issue_quote: issueContext.quote,
        diagnosis: issueContext.diagnosis.problem
      },
      gaps: selectedGaps,
      questions,
      estimated_time_to_gather: estimatedTime,
      minimum_questions_needed: Math.min(1, selectedGaps.length),
      ideal_questions_answered: selectedGaps.length,
      conversation_guidance: {
        opening_frame: this.getOpeningFrame(selectedGaps),
        tone: hasDeepQuestions ? 'encouraging' : 'curious',
        if_student_struggles: 'If you can\'t remember specifics, that\'s okay. Just describe the general scene or feeling as best you can.',
        when_to_stop: 'You\'ve gathered enough when you have at least one concrete detail, sensory observation, or specific insight.'
      }
    };
  }

  /**
   * Check if we have enough context to proceed with suggestions
   *
   * @param gaps The detected gaps
   * @param essayType The type of essay
   * @returns Whether we can proceed or need to gather context first
   */
  shouldGatherContext(
    gaps: ContextGap[],
    essayType: SupplementalType
  ): { should_gather: boolean; reason: string; severity: 'blocking' | 'would_improve' | 'optional' } {
    const criticalGapTypes = TYPE_CRITICAL_GAPS[essayType] || [];
    const criticalGaps = gaps.filter(g =>
      g.priority === 'critical' || criticalGapTypes.includes(g.gap_type)
    );
    const highPriorityGaps = gaps.filter(g => g.priority === 'high');

    if (criticalGaps.length >= 2) {
      return {
        should_gather: true,
        reason: `Found ${criticalGaps.length} critical context gaps that would require inventing details`,
        severity: 'blocking'
      };
    }

    if (criticalGaps.length === 1 || highPriorityGaps.length >= 3) {
      return {
        should_gather: true,
        reason: `Found ${criticalGaps.length} critical and ${highPriorityGaps.length} high-priority gaps`,
        severity: 'would_improve'
      };
    }

    if (gaps.length > 0) {
      return {
        should_gather: false,
        reason: `${gaps.length} minor gaps detected but we can proceed`,
        severity: 'optional'
      };
    }

    return {
      should_gather: false,
      reason: 'No significant context gaps detected',
      severity: 'optional'
    };
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private getWhyItMatters(gapType: ContextGapType): string {
    const reasons: Record<ContextGapType, string> = {
      missing_specific_moment: 'Without a concrete moment, the essay feels abstract and forgettable',
      missing_sensory_detail: 'Sensory details make experiences real and memorable to readers',
      missing_emotional_reaction: 'Emotions connect readers to your experience authentically',
      missing_thought_process: 'Your thinking shows depth and makes insights feel earned',
      missing_dialogue: 'Dialogue brings scenes to life and shows relationships',
      missing_specific_insight: 'Generic insights feel performative rather than genuine',
      missing_limitation_discovered: 'Limitations show intellectual honesty and growth',
      missing_contradiction_faced: 'Contradictions reveal depth of engagement',
      missing_synthesis: 'Synthesis shows original thinking, not just consumption',
      missing_personal_stake: 'Without personal stake, motivation feels manufactured',
      missing_consequence: 'Consequences prove the experience mattered',
      missing_ongoing_relevance: 'Ongoing relevance shows lasting impact',
      missing_research_depth: 'Surface research is a red flag for admissions officers',
      missing_unique_angle: 'Unique angles differentiate you from thousands of similar essays',
      missing_failed_attempt: 'Failures humanize and show persistence',
      missing_person_detail: 'Generic people feel like props rather than real influences',
      missing_relationship_dynamic: 'Relationship dynamics reveal character'
    };
    return reasons[gapType];
  }

  private getWhatWouldFixIt(gapType: ContextGapType): string {
    const fixes: Record<ContextGapType, string> = {
      missing_specific_moment: 'A specific scene with who, what, when, where',
      missing_sensory_detail: 'What you saw, heard, smelled, felt physically',
      missing_emotional_reaction: 'The feeling in that moment, not a label but the sensation',
      missing_thought_process: 'The questions you asked yourself, the reasoning',
      missing_dialogue: 'Actual words spoken, even if paraphrased',
      missing_specific_insight: 'Something you now understand differently',
      missing_limitation_discovered: 'Where your approach hit a wall, what didn\'t work',
      missing_contradiction_faced: 'Something that didn\'t fit your expectations',
      missing_synthesis: 'How two seemingly unrelated things connected for you',
      missing_personal_stake: 'Why YOU specifically cared, not why anyone would care',
      missing_consequence: 'What changed after - action you took, perspective that shifted',
      missing_ongoing_relevance: 'How this still affects your thinking or actions today',
      missing_research_depth: 'Specific details that show you\'ve gone beyond surface level',
      missing_unique_angle: 'Something you notice that others in your position might miss',
      missing_failed_attempt: 'Specific things you tried that didn\'t work',
      missing_person_detail: 'Memorable traits, habits, or moments with this person',
      missing_relationship_dynamic: 'How you interact, what your conversations are like'
    };
    return fixes[gapType];
  }

  private getDefaultPriority(gapType: ContextGapType): ContextGap['priority'] {
    const critical: ContextGapType[] = [
      'missing_specific_moment',
      'missing_specific_insight',
      'missing_personal_stake'
    ];
    const high: ContextGapType[] = [
      'missing_limitation_discovered',
      'missing_contradiction_faced',
      'missing_unique_angle',
      'missing_failed_attempt'
    ];

    if (critical.includes(gapType)) return 'critical';
    if (high.includes(gapType)) return 'high';
    return 'medium';
  }

  private getDifficulty(gapType: ContextGapType): ContextGap['difficulty'] {
    const deep: ContextGapType[] = [
      'missing_limitation_discovered',
      'missing_contradiction_faced',
      'missing_synthesis',
      'missing_unique_angle'
    ];
    const moderate: ContextGapType[] = [
      'missing_specific_insight',
      'missing_personal_stake',
      'missing_thought_process',
      'missing_ongoing_relevance'
    ];

    if (deep.includes(gapType)) return 'deep_reflection';
    if (moderate.includes(gapType)) return 'moderate';
    return 'easy';
  }

  private getSignsOfGoodAnswer(gapType: ContextGapType): string[] {
    const common = ['Contains specific details', 'Uses concrete nouns not abstractions'];
    const specific: Record<ContextGapType, string[]> = {
      missing_specific_moment: ['Has who/what/when/where', 'Describes action not summary'],
      missing_sensory_detail: ['Mentions sights/sounds/textures', 'Shows not tells'],
      missing_emotional_reaction: ['Names the feeling in the body', 'Describes physical sensation'],
      missing_thought_process: ['Shows the reasoning', 'Includes questions asked'],
      missing_dialogue: ['Has actual words spoken', 'Captures how they talk'],
      missing_specific_insight: ['States the realization clearly', 'Differs from what they thought before'],
      missing_limitation_discovered: ['Names what didn\'t work', 'Shows awareness of why'],
      missing_contradiction_faced: ['Describes the surprise', 'Shows expectation vs reality'],
      missing_synthesis: ['Connects two ideas', 'Shows original combination'],
      missing_personal_stake: ['Explains their unique reason', 'Goes beyond general interest'],
      missing_consequence: ['Shows what changed', 'Describes concrete result'],
      missing_ongoing_relevance: ['Links to present', 'Shows continued influence'],
      missing_research_depth: ['Names specifics', 'Shows they\'ve read/explored'],
      missing_unique_angle: ['Offers unusual perspective', 'Shows personal lens'],
      missing_failed_attempt: ['Names what was tried', 'Shows learning from failure'],
      missing_person_detail: ['Has memorable trait', 'Shows specific moment with them'],
      missing_relationship_dynamic: ['Shows how they interact', 'Reveals nature of relationship']
    };

    return [...common, ...specific[gapType]];
  }

  private inferGapTypeFromIssue(
    issue: IssueContext,
    essayType: SupplementalType
  ): ContextGapType | null {
    const problem = issue.diagnosis.problem.toLowerCase();
    const symptom = issue.diagnosis.symptom_type.toLowerCase();

    // Check for performative patterns
    if (symptom.includes('performative') || problem.includes('performative')) {
      // Infer based on essay type's critical needs
      const criticalGaps = TYPE_CRITICAL_GAPS[essayType] || [];
      return criticalGaps[0] || 'missing_specific_insight';
    }

    // Check for specificity issues
    if (problem.includes('generic') || problem.includes('vague')) {
      return 'missing_specific_moment';
    }

    // Check for depth issues
    if (problem.includes('surface') || problem.includes('shallow')) {
      return 'missing_research_depth';
    }

    // Check for authenticity issues
    if (problem.includes('authentic') || problem.includes('genuine')) {
      return 'missing_personal_stake';
    }

    return null;
  }

  private getParagraphNumber(essay: string, quote: string): number {
    const index = essay.indexOf(quote);
    if (index === -1) return 1;
    const before = essay.substring(0, index);
    return (before.match(/\n\n/g) || []).length + 1;
  }

  private deduplicateGaps(gaps: ContextGap[]): ContextGap[] {
    const seen = new Set<string>();
    return gaps.filter(gap => {
      const key = `${gap.gap_type}_${gap.location.paragraph}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  private sortGapsByPriority(gaps: ContextGap[]): ContextGap[] {
    const priorityOrder = { critical: 0, high: 1, medium: 2, low: 3 };
    return gaps.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  }

  private getOpeningFrame(gaps: ContextGap[]): string {
    const mainGapType = gaps[0]?.gap_type;

    if (!mainGapType) {
      return 'I\'d like to learn more about your experience to make the essay more vivid.';
    }

    const frames: Record<ContextGapType, string> = {
      missing_specific_moment: 'I want to help you capture this moment more vividly. Let me ask a few questions to get the details.',
      missing_sensory_detail: 'Your essay would be more memorable with some concrete details. Can you help me see what you experienced?',
      missing_emotional_reaction: 'I\'d love to understand how this felt for you. Let\'s dig into that a bit.',
      missing_thought_process: 'Walk me through your thinking here. What was going on in your head?',
      missing_dialogue: 'Can you help me hear this conversation? What did people actually say?',
      missing_specific_insight: 'I want to understand exactly what clicked for you. Let\'s unpack that realization.',
      missing_limitation_discovered: 'The struggles are often the most interesting part. What didn\'t work?',
      missing_contradiction_faced: 'Surprises and contradictions make essays memorable. What didn\'t go as expected?',
      missing_synthesis: 'I\'m curious about how you connected these ideas. Walk me through that.',
      missing_personal_stake: 'I want to understand why this matters to YOU specifically. What\'s your personal connection?',
      missing_consequence: 'What actually changed after this? Let\'s trace the impact.',
      missing_ongoing_relevance: 'How does this still show up in your life? I want to see the lasting effect.',
      missing_research_depth: 'Tell me more about what specifically interested you. Let\'s go deeper than the surface.',
      missing_unique_angle: 'What do YOU see here that others might miss? What\'s your unique perspective?',
      missing_failed_attempt: 'The failures are often more interesting than successes. What went wrong?',
      missing_person_detail: 'Help me see this person. What makes them memorable to you?',
      missing_relationship_dynamic: 'Tell me about how you two interact. What\'s your dynamic like?'
    };

    return frames[mainGapType];
  }
}

// ============================================================================
// INTEGRATION WITH STRATEGIC SPECIFICITY
// ============================================================================

import {
  strategicSpecificityService,
  type SpecificityAnalysis,
  type ContextQualityScore,
  type SpecificityType,
  type SpecificityImpactZone
} from './strategicSpecificityService';

/**
 * Enhanced context decision that considers strategic impact
 */
export interface StrategicContextDecision {
  should_gather: boolean;
  priority: 'high' | 'medium' | 'low' | 'none';
  reason: string;

  // Strategic insight
  specificity_analysis: SpecificityAnalysis;

  // What to focus on
  high_impact_zones: Array<{
    zone: SpecificityImpactZone;
    specificity_type: SpecificityType;
    question_focus: string;
  }>;

  // What to avoid asking about
  keep_lean_areas: string[];

  // Budget guidance
  word_budget: number;
  max_questions: number;
}

/**
 * Extended ContextGapDetector with strategic specificity integration
 */
export class StrategicContextGapDetector extends ContextGapDetector {

  /**
   * Make a strategic decision about whether to gather context
   *
   * This combines:
   * 1. Pattern-based gap detection
   * 2. Strategic specificity analysis (what matters for THIS essay type)
   * 3. Word budget considerations
   */
  makeStrategicDecision(
    essayDraft: string,
    essayType: SupplementalType,
    issues: IssueContext[],
    wordLimit: number = 250
  ): StrategicContextDecision {
    const currentWordCount = essayDraft.split(/\s+/).length;

    // Get specificity analysis
    const specificityAnalysis = strategicSpecificityService.analyzeSpecificityNeeds(
      essayDraft,
      essayType,
      issues
    );

    // Get strategic decision from specificity service
    const specificityDecision = strategicSpecificityService.shouldGatherContext(
      specificityAnalysis,
      currentWordCount,
      wordLimit
    );

    // Also check pattern-based gaps
    const patternGaps = this.detectGaps(essayDraft, essayType, issues);
    const patternDecision = this.shouldGatherContext(patternGaps, essayType);

    // Combine decisions - specificity service takes precedence for priority
    const shouldGather = specificityDecision.should_gather ||
      (patternDecision.should_gather && patternDecision.severity === 'blocking');

    // Build high-impact zones from specificity analysis
    const highImpactZones = specificityAnalysis.high_impact_needs
      .filter(need => need.reasoning.word_budget === 'invest_heavily')
      .map(need => ({
        zone: need.impact_zone,
        specificity_type: need.specificity_type,
        question_focus: need.question_focus
      }));

    return {
      should_gather: shouldGather,
      priority: specificityDecision.priority,
      reason: shouldGather
        ? specificityDecision.reason
        : 'Essay has sufficient specificity in high-impact areas',
      specificity_analysis: specificityAnalysis,
      high_impact_zones: highImpactZones,
      keep_lean_areas: specificityAnalysis.keep_lean,
      word_budget: specificityAnalysis.assessment.words_to_invest,
      max_questions: specificityDecision.max_questions
    };
  }

  /**
   * Validate context quality before accepting it
   *
   * Uses strategic specificity scoring to determine if
   * the gathered context is good enough for its intended purpose
   */
  validateGatheredContext(
    studentResponse: string,
    intendedSpecificityType: SpecificityType,
    impactZone: SpecificityImpactZone
  ): {
    accepted: boolean;
    quality: ContextQualityScore;
    action: 'use' | 'follow_up' | 'skip';
    follow_up_question?: string;
  } {
    const quality = strategicSpecificityService.scoreContextQuality(
      studentResponse,
      intendedSpecificityType,
      impactZone
    );

    if (quality.feedback.should_accept) {
      return {
        accepted: true,
        quality,
        action: 'use'
      };
    }

    // If close to acceptable, ask follow-up
    if (quality.overall >= 2.0 && quality.feedback.follow_up_question) {
      return {
        accepted: false,
        quality,
        action: 'follow_up',
        follow_up_question: quality.feedback.follow_up_question
      };
    }

    // Too weak, skip this context
    return {
      accepted: false,
      quality,
      action: 'skip'
    };
  }

  /**
   * Create a gathering request focused on strategic priorities
   *
   * Unlike the basic createGatheringRequest, this:
   * 1. Prioritizes high-impact zones
   * 2. Skips questions about keep-lean areas
   * 3. Limits questions based on word budget
   */
  createStrategicGatheringRequest(
    issueContext: IssueContext,
    essayDraft: string,
    essayType: SupplementalType,
    wordLimit: number = 250
  ): ContextGatheringRequest {
    // Get strategic decision first
    const decision = this.makeStrategicDecision(
      essayDraft,
      essayType,
      [issueContext],
      wordLimit
    );

    // Get pattern-based gaps but filter by strategic priorities
    const allGaps = this.detectGaps(essayDraft, essayType, [issueContext]);

    // Filter gaps to only those that match high-impact zones
    const strategicGapTypes = decision.high_impact_zones.map(z => {
      // Map specificity types to gap types
      const typeMap: Record<SpecificityType, ContextGapType[]> = {
        concrete_scene: ['missing_specific_moment', 'missing_sensory_detail'],
        sensory_detail: ['missing_sensory_detail', 'missing_emotional_reaction'],
        authentic_insight: ['missing_specific_insight', 'missing_limitation_discovered'],
        research_evidence: ['missing_research_depth'],
        person_detail: ['missing_person_detail', 'missing_relationship_dynamic'],
        failure_or_struggle: ['missing_failed_attempt', 'missing_limitation_discovered'],
        none_needed: []
      };
      return typeMap[z.specificity_type];
    }).flat();

    const prioritizedGaps = allGaps.filter(gap =>
      strategicGapTypes.includes(gap.gap_type)
    );

    // Use prioritized gaps if we have them, otherwise fall back to all gaps
    const gapsToUse = prioritizedGaps.length > 0 ? prioritizedGaps : allGaps;

    // Create request with limited questions based on strategic decision
    return this.createGatheringRequest(
      issueContext,
      gapsToUse,
      decision.max_questions
    );
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export const contextGapDetector = new ContextGapDetector();
export const strategicContextGapDetector = new StrategicContextGapDetector();
