/**
 * Full Chat Response Testing Suite with Actual Responses
 *
 * This generates actual mock responses for all 15 test scenarios
 * so we can analyze and iterate on response quality.
 */

// Import the mock response generator logic inline since we can't import from TypeScript
// We'll replicate the core logic here for testing

interface WorkshopChatContext {
  activity: {
    name: string;
    role: string;
    category: string;
  };
  analysis: {
    nqi: number;
    tier: string;
    delta: number;
    initialNqi: number;
    weakCategories: Array<{
      name: string;
      score: number;
      gap: number;
    }>;
  };
  teaching: {
    topIssues: Array<{
      id: string;
      title: string;
      severity: string;
      fromDraft: string;
      principle: string;
      impactOnScore: string;
      problem: string;
      whyMatters: string;
      suggestions: string[];
      hasReflectionPrompts: boolean;
    }>;
    quickWins: Array<{
      title: string;
      effort: string;
      impact: string;
    }>;
  };
  history: {
    totalVersions: number;
    improvementTrend: string;
  };
  reflection: {
    totalCount: number;
    completionPercentage: number;
  };
}

// Plain language helper
function getPlainLanguageExplanation(categoryName: string): string {
  const explanations: Record<string, string> = {
    voice_integrity: 'making sure your authentic personality and voice come through clearly',
    specificity_evidence: 'adding specific details, numbers, and concrete examples that bring your story to life',
    transformative_impact: 'showing how this experience changed you or made a real difference',
    future_oriented: 'connecting this experience to your future goals and aspirations',
    emotional_maturity: 'demonstrating self-awareness and reflection on what you learned',
    intellectual_depth: 'showing how you think critically and engage with complex ideas',
    institutional_savvy: 'understanding how your work fits into larger systems and organizations',
    authentic_challenge: 'being honest about real obstacles you faced and how you dealt with them',
    elite_positioning: 'demonstrating the level of sophistication and impact that stands out',
    narrative_craft: 'telling your story in a compelling, well-structured way',
    holistic_excellence: 'bringing together all the elements into a cohesive, powerful narrative',
    reflection_meaning: 'reflecting deeply on why this experience mattered and what it taught you',
    narrative_arc_stakes: 'telling a story with clear stakes, tension, and resolution'
  };
  return explanations[categoryName] || 'strengthening this aspect of your narrative';
}

// Mock response generator (simplified version for testing)
function generateMockResponse(userMessage: string, context: WorkshopChatContext): string {
  const lowerMessage = userMessage.toLowerCase();
  const topIssue = context.teaching.topIssues[0];
  const topWeakCat = context.analysis.weakCategories[0];

  // Score-related questions
  if (lowerMessage.includes('score') || lowerMessage.includes('nqi') || lowerMessage.includes('low')) {
    // Very low score (< 40)
    if (context.analysis.nqi < 40) {
      return `I can see your ${context.activity.name} narrative is in the early stages - and that's completely okay! Everyone starts somewhere.

Right now, the story you're telling needs some fundamental development. Think of it like this: admissions officers are looking for a narrative that shows who you are, what you've learned, and why it matters. Your draft is missing some of these core pieces.

${topIssue ? `The biggest opportunity I see is around **${topIssue.title.toLowerCase()}**. ${topIssue.fromDraft ? `When you wrote "${topIssue.fromDraft.substring(0, 80)}..." - ` : ''}this is a start, but we need to dig deeper into the *why* behind your experience.` : ''}

${topWeakCat ? `Specifically, your narrative could use more **${topWeakCat.name.replace(/_/g, ' ')}** - which essentially means ${getPlainLanguageExplanation(topWeakCat.name)}.` : ''}

Want to talk through what made this experience meaningful to you? That's usually the best place to start.`;
    }

    // Low score (40-60)
    if (context.analysis.nqi < 60) {
      return `Your ${context.activity.name} narrative has the foundation in place - you're telling a story, there are details, and I can see what you did. That's good!

The challenge now is about depth and authenticity. ${context.analysis.delta > 0 ? `You've already improved by ${context.analysis.delta} points, which shows you're on the right track. ` : ''}The narrative feels a bit surface-level right now - like you're reporting what happened rather than reflecting on what it meant.

${topIssue ? `The main thing holding you back is **${topIssue.title.toLowerCase()}**. ${topIssue.fromDraft ? `Take this part: "${topIssue.fromDraft.substring(0, 100)}..." ` : ''}This tells me *what* you did, but I want to understand *who you became* through this experience.` : ''}

${topWeakCat ? `To push this to the next level, focus on ${getPlainLanguageExplanation(topWeakCat.name)} - that's where I see the biggest gap between where you are and where this narrative could be.` : ''}

Should we explore what this experience taught you about yourself?`;
    }

    // Decent score (60-75)
    if (context.analysis.nqi < 75) {
      return `Your ${context.activity.name} narrative is in solid shape! ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points already, which is great progress. ` : ''}You're telling a clear story with specific details, and I can see your personality coming through.

What would push this into the "excellent" tier is sharpening a few key areas. ${topIssue ? `The most impactful thing you could work on is **${topIssue.title.toLowerCase()}**. ${topIssue.fromDraft ? `When I read "${topIssue.fromDraft.substring(0, 100)}..." ` : ''}it's good, but there's an opportunity to go deeper here.` : ''}

${topWeakCat ? `Specifically, your ${topWeakCat.name.replace(/_/g, ' ')} could be stronger - ${getPlainLanguageExplanation(topWeakCat.name)}. This doesn't require rewriting everything; it's more about enriching what you already have.` : ''}

Want me to help you identify where you could add more depth or authenticity?`;
    }

    // Good score (75-85)
    if (context.analysis.nqi < 85) {
      return `This is a strong narrative! ${context.analysis.delta > 0 ? `And you've improved ${context.analysis.delta} points - you're clearly refining your story. ` : ''}Your ${context.activity.name} essay shows authentic voice, specific details, and meaningful reflection.

At this level, we're talking about polish and precision. ${topIssue ? `The one area I'd focus on is **${topIssue.title.toLowerCase()}**. ${topIssue.fromDraft ? `You wrote: "${topIssue.fromDraft.substring(0, 100)}..." which is good, but ` : ''}there's a subtle way to make this even more impactful.` : ''}

${topWeakCat ? `Your ${topWeakCat.name.replace(/_/g, ' ')} is close - just ${Math.round(topWeakCat.gap)} point${topWeakCat.gap > 1 ? 's' : ''} away from the target. A small adjustment here could make a big difference.` : ''}

Should we dive into that finishing touch?`;
    }

    // Excellent score (85+)
    return `Your ${context.activity.name} narrative is excellent! ${context.analysis.delta > 0 ? `You've improved ${context.analysis.delta} points to get here - ` : ''}This is the kind of essay that stands out in admissions.

You're telling an authentic story with specific evidence, genuine reflection, and a clear sense of who you are. ${topIssue ? `If I had to suggest one small refinement, it would be around ${topIssue.title.toLowerCase()} - ` : ''}but honestly, you're in great shape.

${context.analysis.nqi >= 90 ? 'At this point, the best advice is: don\'t over-edit. Your authentic voice is what makes this work.' : 'Focus on maintaining your authentic voice and making sure every sentence earns its place.'}

Want to talk about any specific part you're unsure about?`;
  }

  // Priority/focus questions
  if (lowerMessage.includes('focus') || lowerMessage.includes('priority') || lowerMessage.includes('first') || lowerMessage.includes('start')) {
    if (!topIssue) {
      return `Honestly? Your ${context.activity.name} narrative is in really good shape. You don't have any glaring issues that need fixing.

At this point, I'd focus on polish - reading it aloud to make sure your authentic voice comes through, and making sure every sentence adds something meaningful. Sometimes the best move is to stop editing and trust what you've written.

Is there a specific part you're unsure about? I'm happy to talk through any section that feels off to you.`;
    }

    const excerpt = topIssue.fromDraft ? topIssue.fromDraft.substring(0, 120) : '';
    return `If I had to pick one thing to focus on, it would be **${topIssue.title.toLowerCase()}**.

${excerpt ? `I'm looking at this part of your draft: "${excerpt}${topIssue.fromDraft && topIssue.fromDraft.length > 120 ? '...' : ''}"

` : ''}Here's what I notice: ${topIssue.problem || 'this section could be stronger'}. ${topIssue.whyMatters ? `This matters because ${topIssue.whyMatters.toLowerCase()}` : 'Strengthening this would make your whole narrative more compelling'}.

${context.teaching.quickWins && context.teaching.quickWins.length > 0 && context.teaching.quickWins[0].title !== topIssue.title ? `There's also a quick win here - ${context.teaching.quickWins[0].title.toLowerCase()}. That's something you could tackle in just a few minutes that would make a noticeable difference.

` : ''}Want to talk through how to approach this? I can help you think through what changes would make the biggest impact.`;
  }

  // Progress/improvement questions
  if (lowerMessage.includes('progress') || lowerMessage.includes('improv') || lowerMessage.includes('better')) {
    if (context.analysis.delta > 0) {
      const versions = context.history.totalVersions;
      return `You've made real progress! ${context.analysis.delta} points is significant movement${versions > 1 ? ` over ${versions} versions` : ''}.

${context.history.improvementTrend ? `Your trajectory is ${context.history.improvementTrend.toLowerCase()} - which tells me you're refining your thinking and not just making surface changes. ` : ''}${context.analysis.nqi >= 80 ? 'You\'re in the excellent tier now, which is great!' : context.analysis.nqi >= 70 ? 'You\'re in solid territory - keep pushing.' : 'There\'s more room to grow, but you\'re headed in the right direction.'}

${context.analysis.nqi < 80 ? 'If you want to keep climbing, focus on the one or two areas where you can add the most depth or authenticity. Want to talk about where that might be?' : 'At this point, my advice is: don\'t over-edit. You\'ve built something strong - trust it.'}`;
    }

    return `You're starting from a good foundation. ${context.analysis.nqi >= 80 ? 'Your narrative is already strong!' : context.analysis.nqi >= 70 ? 'You\'re in solid territory - there\'s room to refine, but the core is there.' : 'There\'s definitely opportunity to strengthen this narrative.'}

Want to talk about where to focus your energy to make the biggest improvement?`;
  }

  // Stuck/help questions
  if (lowerMessage.includes('stuck') || lowerMessage.includes('help') || lowerMessage.includes('don\'t know')) {
    return `I'm here - let's work through this together.

${topIssue ? `For your ${context.activity.name} narrative, the thing that would make the biggest difference is working on **${topIssue.title.toLowerCase()}**. ${topIssue.problem ? `The challenge is: ${topIssue.problem.toLowerCase()}.` : ''}` : `Your ${context.activity.name} narrative has potential - let's figure out how to unlock it.`}

${context.reflection.totalCount > 0 ? `You have ${context.reflection.totalCount} reflection prompts available. ${context.reflection.completionPercentage > 50 ? `You've already completed ${context.reflection.completionPercentage.toFixed(0)}% - nice work! ` : `You've completed ${context.reflection.completionPercentage.toFixed(0)}% so far. `}These questions are designed to help you think more deeply about your experience.` : ''}

What are you stuck on specifically? Sometimes naming the problem is half the solution. I can help you:
- Think through why a particular section isn't working
- Understand what admissions officers are really looking for
- Identify which issue would make the biggest difference if you tackled it
- Work through reflection questions to develop your thinking`;
  }

  // Category-specific questions
  if (topWeakCat && (lowerMessage.includes(topWeakCat.name.toLowerCase().replace(/_/g, ' ')) || lowerMessage.includes(topWeakCat.name.toLowerCase()))) {
    const plainLanguage = getPlainLanguageExplanation(topWeakCat.name);
    return `Let's talk about ${topWeakCat.name.replace(/_/g, ' ')} - which is really about ${plainLanguage}.

${topWeakCat.score < 5 ? 'This is one of the weaker areas in your narrative right now. ' : topWeakCat.score < 7 ? 'You\'re partway there, but this needs some strengthening. ' : 'You\'re close - just needs a bit more depth. '}Looking at your ${context.activity.name} narrative, ${topWeakCat.score < 5 ? 'this dimension is pretty much missing' : topWeakCat.score < 7 ? 'I can see hints of this, but it needs to be more prominent' : 'this is present but could be stronger'}.

${topWeakCat.score < 5 ? `Think about moments in your experience that really mattered to you - times when you were challenged, surprised, or changed. That's usually where ${plainLanguage} comes from.` : topWeakCat.score < 7 ? `You've started to show this, but I want to see more depth. What were the moments that really shaped you?` : `You're almost there. What's one more specific detail or reflection you could add to really drive this home?`}

Want me to help you identify where in your draft you could strengthen this?`;
  }

  // Default: General guidance
  return `Let's talk about your ${context.activity.name} narrative.

${context.analysis.nqi >= 80 ? 'You\'re in strong shape - your narrative is working. ' : context.analysis.nqi >= 70 ? 'You\'ve got a solid foundation here. ' : context.analysis.nqi >= 60 ? 'There\'s potential here, and some clear opportunities to strengthen it. ' : 'This narrative needs some development, but that\'s okay - we can work on it together. '}${context.analysis.delta > 0 ? `You've already improved by ${context.analysis.delta} points, which shows you're refining your thinking. ` : ''}

${topIssue ? `The biggest opportunity I see is around **${topIssue.title.toLowerCase()}**. ${topIssue.problem ? `${topIssue.problem}. ` : ''}` : ''}${topWeakCat ? `Your narrative could especially use more ${getPlainLanguageExplanation(topWeakCat.name)}.` : ''}

What would be most helpful to talk through? I can:
- Walk you through what would make the biggest impact
- Explain what's working and what isn't in specific sections
- Help you think through reflection questions to develop your ideas
- Talk about what admissions officers are really looking for in these narratives

*Note: This is development mode with contextual mock responses. For full AI conversation, add a valid ANTHROPIC_API_KEY to .env*`;
}

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestCase {
  id: string;
  name: string;
  context: WorkshopChatContext;
  question: string;
  expectedQualities: string[];
}

const tests: TestCase[] = [
  {
    id: 'test-1',
    name: 'Very Weak Narrative (15/100) - Score Question',
    context: {
      activity: { name: 'Debate Team', role: 'Member', category: 'Academic' },
      analysis: {
        nqi: 15,
        tier: 'weak',
        delta: 0,
        initialNqi: 15,
        weakCategories: [
          { name: 'reflection_meaning', score: 0.5, gap: 6.5 },
          { name: 'narrative_arc_stakes', score: 1, gap: 6 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i1',
          title: 'Add Deep Personal Reflection',
          severity: 'critical',
          fromDraft: 'I learned a lot about public speaking',
          principle: 'Show transformation through reflection',
          impactOnScore: 'Could improve NQI by 15-20 points',
          problem: 'The narrative states facts but doesn\'t reflect on meaning',
          whyMatters: 'Admissions officers need to see how you grew as a person',
          suggestions: ['Describe a specific moment that changed your thinking'],
          hasReflectionPrompts: true
        }],
        quickWins: []
      },
      history: { totalVersions: 1, improvementTrend: 'initial draft' },
      reflection: { totalCount: 5, completionPercentage: 0 }
    },
    question: 'Why is my score so low?',
    expectedQualities: [
      'Encouraging tone',
      'Not judgmental',
      'Mentions "early stages"',
      'Explains what\'s missing',
      'Provides specific opportunity',
      'Translates category to plain language',
      'Ends with supportive question'
    ]
  },
  {
    id: 'test-2',
    name: 'Basic Narrative (45/100) - Priority Question',
    context: {
      activity: { name: 'Community Garden Project', role: 'Founder', category: 'Community Service' },
      analysis: {
        nqi: 45,
        tier: 'developing',
        delta: 0,
        initialNqi: 45,
        weakCategories: [
          { name: 'transformative_impact', score: 4, gap: 3 },
          { name: 'emotional_maturity', score: 3, gap: 4 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i2',
          title: 'Show Personal Transformation',
          severity: 'high',
          fromDraft: 'I organized volunteers and managed the garden',
          principle: 'Move from reporting to reflecting',
          impactOnScore: 'Could improve NQI by 10-12 points',
          problem: 'You tell what you did, but not who you became',
          whyMatters: 'Elite narratives show internal growth, not just external achievements',
          suggestions: ['What surprised you about this work?'],
          hasReflectionPrompts: true
        }],
        quickWins: []
      },
      history: { totalVersions: 1, improvementTrend: 'initial draft' },
      reflection: { totalCount: 4, completionPercentage: 0 }
    },
    question: 'What should I focus on first?',
    expectedQualities: [
      'Acknowledges foundation',
      'Pushes for depth',
      'ONE main focus',
      'Quotes specific excerpt',
      'Explains why it matters',
      'Ends with actionable question'
    ]
  },
  {
    id: 'test-3',
    name: 'Solid Narrative (68/100) - Fix Question',
    context: {
      activity: { name: 'Math Tutoring Initiative', role: 'Lead Tutor', category: 'Academic' },
      analysis: {
        nqi: 68,
        tier: 'competitive',
        delta: 0,
        initialNqi: 68,
        weakCategories: [
          { name: 'intellectual_depth', score: 6, gap: 1 },
          { name: 'future_oriented', score: 5, gap: 2 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i3',
          title: 'Connect to Future Goals',
          severity: 'medium',
          fromDraft: 'I developed a new approach focused on small wins',
          principle: 'Link past experiences to future aspirations',
          impactOnScore: 'Could improve NQI by 5-7 points',
          problem: 'Strong reflection on the past, but no connection to your future',
          whyMatters: 'Top schools want to see how experiences shape your trajectory',
          suggestions: ['How will this approach influence your college goals?'],
          hasReflectionPrompts: false
        }],
        quickWins: []
      },
      history: { totalVersions: 2, improvementTrend: 'improving' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'How do I improve this section about my new approach?',
    expectedQualities: [
      'Validates quality',
      'Suggests refinement',
      'Quotes their draft',
      'Explains opportunity',
      'Doesn\'t require rewriting',
      'Conversational tone'
    ]
  },
  {
    id: 'test-4',
    name: 'Strong Narrative (78/100) - Category Question',
    context: {
      activity: { name: 'Robotics Team', role: 'Programming Lead', category: 'STEM' },
      analysis: {
        nqi: 78,
        tier: 'strong',
        delta: 0,
        initialNqi: 78,
        weakCategories: [
          { name: 'institutional_savvy', score: 6, gap: 1 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i4',
          title: 'Add Institutional Context',
          severity: 'low',
          fromDraft: 'we built a team culture where failure became our best teacher',
          principle: 'Show awareness of larger systems',
          impactOnScore: 'Could improve NQI by 3-5 points',
          problem: 'Great personal story, but could connect to how robotics programs work',
          whyMatters: 'Elite students understand their work in broader contexts',
          suggestions: ['How did this fit into your school\'s STEM culture?'],
          hasReflectionPrompts: false
        }],
        quickWins: []
      },
      history: { totalVersions: 3, improvementTrend: 'steadily improving' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'Why is my institutional_savvy score only 6?',
    expectedQualities: [
      'Validates strong narrative',
      'Explains category in plain language',
      'Shows closeness to target',
      'Suggests subtle adjustment',
      'Not overwhelming'
    ]
  },
  {
    id: 'test-5',
    name: 'Excellent Narrative (88/100) - Score Question',
    context: {
      activity: { name: 'Immigration Legal Aid', role: 'Student Coordinator', category: 'Community Service' },
      analysis: {
        nqi: 88,
        tier: 'excellent',
        delta: 0,
        initialNqi: 88,
        weakCategories: []
      },
      teaching: {
        topIssues: [],
        quickWins: []
      },
      history: { totalVersions: 5, improvementTrend: 'excellent trajectory' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'How is my score overall?',
    expectedQualities: [
      'Celebratory tone',
      'Validates excellence',
      'Mentions standing out',
      'Warns against over-editing',
      'Builds confidence'
    ]
  },
  {
    id: 'test-6',
    name: 'Improving Narrative (50→62) - Progress Question',
    context: {
      activity: { name: 'School Newspaper', role: 'Editor', category: 'Journalism' },
      analysis: {
        nqi: 62,
        tier: 'developing',
        delta: 12,
        initialNqi: 50,
        weakCategories: []
      },
      teaching: {
        topIssues: [{
          id: 'i6',
          title: 'Add Specific Examples',
          severity: 'medium',
          fromDraft: 'balance truth-telling with sensitivity',
          principle: 'Show through specific moments',
          impactOnScore: 'Could improve NQI by 8-10 points',
          problem: 'Abstract concepts need concrete examples',
          whyMatters: 'Specificity makes your story believable',
          suggestions: ['What was one specific moment of this tension?'],
          hasReflectionPrompts: true
        }],
        quickWins: []
      },
      history: { totalVersions: 4, improvementTrend: 'steadily improving' },
      reflection: { totalCount: 3, completionPercentage: 33 }
    },
    question: 'How much have I improved?',
    expectedQualities: [
      'Celebrates progress',
      'Mentions delta and versions',
      'References trajectory',
      'Encourages continued work',
      'Suggests next milestone'
    ]
  },
  {
    id: 'test-7',
    name: 'Very Stuck Student (28/100) - Help Question',
    context: {
      activity: { name: 'Environmental Club', role: 'President', category: 'Environmental' },
      analysis: {
        nqi: 28,
        tier: 'weak',
        delta: 0,
        initialNqi: 28,
        weakCategories: [
          { name: 'narrative_craft', score: 2, gap: 5 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i7',
          title: 'Develop Your Story',
          severity: 'critical',
          fromDraft: 'I started a recycling program at school',
          principle: 'Tell a complete narrative',
          impactOnScore: 'Could improve NQI by 20+ points',
          problem: 'This is a topic sentence, not a narrative',
          whyMatters: 'Admissions officers need to see the full story',
          suggestions: ['What challenge did you face?', 'What did you learn?'],
          hasReflectionPrompts: true
        }],
        quickWins: []
      },
      history: { totalVersions: 1, improvementTrend: 'initial draft' },
      reflection: { totalCount: 6, completionPercentage: 0 }
    },
    question: 'I\'m stuck and don\'t know how to make this better',
    expectedQualities: [
      'Supportive tone',
      'Not overwhelming',
      'Offers reflection prompts',
      'Provides menu of help',
      'Problem-solving approach'
    ]
  },
  {
    id: 'test-8',
    name: 'Solid Narrative (71/100) - Vague General Question',
    context: {
      activity: { name: 'Theater Production', role: 'Stage Manager', category: 'Arts' },
      analysis: {
        nqi: 71,
        tier: 'strong',
        delta: 0,
        initialNqi: 71,
        weakCategories: [
          { name: 'specificity_evidence', score: 6, gap: 1 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i8',
          title: 'Add More Specific Details',
          severity: 'medium',
          fromDraft: 'I had to coordinate understudies, adjust lighting cues, and keep the crew calm',
          principle: 'Specificity creates credibility',
          impactOnScore: 'Could improve NQI by 5-7 points',
          problem: 'Good story structure but needs more vivid details',
          whyMatters: 'Specific details make your experience real and memorable',
          suggestions: ['What exactly did you say to keep the crew calm?'],
          hasReflectionPrompts: false
        }],
        quickWins: []
      },
      history: { totalVersions: 2, improvementTrend: 'improving' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'What do you think about this?',
    expectedQualities: [
      'Conversational exploration',
      'Provides overview',
      'Offers menu of options',
      'Asks what would be helpful',
      'Not prescriptive'
    ]
  },
  {
    id: 'test-9',
    name: 'Weak Narrative (35/100) - Category Deep Dive',
    context: {
      activity: { name: 'Coding Bootcamp for Kids', role: 'Instructor', category: 'Education' },
      analysis: {
        nqi: 35,
        tier: 'weak',
        delta: 0,
        initialNqi: 35,
        weakCategories: [
          { name: 'emotional_maturity', score: 2, gap: 5 }
        ]
      },
      teaching: {
        topIssues: [],
        quickWins: []
      },
      history: { totalVersions: 1, improvementTrend: 'initial draft' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'Why is my emotional_maturity score so low?',
    expectedQualities: [
      'Plain language explanation',
      'Diagnostic of weakness',
      'Suggests moments to think about',
      'Educational tone',
      'Offers help to strengthen'
    ]
  },
  {
    id: 'test-10',
    name: 'Nearly Perfect (84/100) - Minor Polish',
    context: {
      activity: { name: 'Research Lab', role: 'Research Assistant', category: 'Research' },
      analysis: {
        nqi: 84,
        tier: 'excellent',
        delta: 0,
        initialNqi: 84,
        weakCategories: [
          { name: 'future_oriented', score: 7, gap: 0.5 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i10',
          title: 'Hint at Future Connection',
          severity: 'low',
          fromDraft: 'I realize that research isn\'t about being brilliant',
          principle: 'Connect insights to future goals',
          impactOnScore: 'Could improve NQI by 2-3 points',
          problem: 'Excellent reflection, just missing a forward look',
          whyMatters: 'Top schools want to see trajectory',
          suggestions: ['One sentence about how this shapes your college research interests'],
          hasReflectionPrompts: false
        }],
        quickWins: []
      },
      history: { totalVersions: 6, improvementTrend: 'excellent trajectory' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'What else could I add to make this perfect?',
    expectedQualities: [
      'Validates excellence',
      'Suggests subtle touch',
      'Warns against over-editing',
      'Minimal change suggested',
      'Confidence-building'
    ]
  },
  {
    id: 'test-11',
    name: 'Mid-Range (52/100) - Multiple Issues Question',
    context: {
      activity: { name: 'Youth Sports Coach', role: 'Volunteer Coach', category: 'Athletics' },
      analysis: {
        nqi: 52,
        tier: 'developing',
        delta: 0,
        initialNqi: 52,
        weakCategories: [
          { name: 'narrative_craft', score: 4, gap: 3 },
          { name: 'transformative_impact', score: 5, gap: 2 }
        ]
      },
      teaching: {
        topIssues: [
          {
            id: 'i11a',
            title: 'Show Personal Growth',
            severity: 'high',
            fromDraft: 'I taught them basic skills and teamwork',
            principle: 'Narratives need personal transformation',
            impactOnScore: 'Could improve NQI by 8-10 points',
            problem: 'You describe what the kids learned, but what did YOU learn?',
            whyMatters: 'Colleges want to see your growth',
            suggestions: ['What surprised you about coaching?'],
            hasReflectionPrompts: true
          },
          {
            id: 'i11b',
            title: 'Improve Narrative Structure',
            severity: 'medium',
            fromDraft: '',
            principle: 'Strong narratives have arc and stakes',
            impactOnScore: 'Could improve NQI by 5-7 points',
            problem: 'The essay reads like a report, not a story',
            whyMatters: 'Stories are memorable; reports are forgettable',
            suggestions: ['Start with a specific moment that mattered'],
            hasReflectionPrompts: false
          }
        ],
        quickWins: [{
          title: 'Add one specific anecdote',
          effort: 'low',
          impact: 'high'
        }]
      },
      history: { totalVersions: 2, improvementTrend: 'improving' },
      reflection: { totalCount: 4, completionPercentage: 25 }
    },
    question: 'I have multiple issues - where should I start?',
    expectedQualities: [
      'Prioritizes ONE issue',
      'Explains highest impact',
      'Mentions quick win',
      'Step-by-step approach',
      'Not overwhelming'
    ]
  },
  {
    id: 'test-12',
    name: 'Improving (65→73) - Progress Tracking',
    context: {
      activity: { name: 'Student Government', role: 'Class Representative', category: 'Leadership' },
      analysis: {
        nqi: 73,
        tier: 'strong',
        delta: 8,
        initialNqi: 65,
        weakCategories: []
      },
      teaching: {
        topIssues: [{
          id: 'i12',
          title: 'Add Specific Dialogue or Details',
          severity: 'low',
          fromDraft: 'build relationships with administrators',
          principle: 'Specificity creates authenticity',
          impactOnScore: 'Could improve NQI by 4-6 points',
          problem: 'Good structure, needs vivid details',
          whyMatters: 'Specific moments make your story believable',
          suggestions: ['What did one administrator actually say?'],
          hasReflectionPrompts: false
        }],
        quickWins: []
      },
      history: { totalVersions: 3, improvementTrend: 'steadily improving' },
      reflection: { totalCount: 2, completionPercentage: 50 }
    },
    question: 'Am I making progress? I\'ve been working on this for weeks.',
    expectedQualities: [
      'Celebrates trajectory',
      'Mentions versions',
      'Acknowledges effort',
      'References refining thinking',
      'Encourages next level'
    ]
  },
  {
    id: 'test-13',
    name: 'Strong (76/100) - Reflection Prompt Request',
    context: {
      activity: { name: 'Hospital Volunteer', role: 'Patient Companion', category: 'Healthcare' },
      analysis: {
        nqi: 76,
        tier: 'strong',
        delta: 0,
        initialNqi: 76,
        weakCategories: [
          { name: 'intellectual_depth', score: 7, gap: 0.5 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i13',
          title: 'Deepen Intellectual Analysis',
          severity: 'low',
          fromDraft: 'healing isn\'t always medical',
          principle: 'Show complex thinking',
          impactOnScore: 'Could improve NQI by 3-4 points',
          problem: 'Good insight, could go deeper intellectually',
          whyMatters: 'Top schools want to see nuanced thinking',
          suggestions: ['What\'s the tension between medical and emotional healing?'],
          hasReflectionPrompts: true
        }],
        quickWins: []
      },
      history: { totalVersions: 3, improvementTrend: 'improving' },
      reflection: { totalCount: 3, completionPercentage: 33 }
    },
    question: 'Can you help me with reflection questions to make this deeper?',
    expectedQualities: [
      'Supportive guide',
      'Mentions reflection prompts',
      'Helps dig deeper',
      'Develop thinking',
      'Walk through questions'
    ]
  },
  {
    id: 'test-14',
    name: 'Very Vague (12/100) - Needs Everything',
    context: {
      activity: { name: 'Music lessons', role: 'Piano student', category: 'Arts' },
      analysis: {
        nqi: 12,
        tier: 'weak',
        delta: 0,
        initialNqi: 12,
        weakCategories: [
          { name: 'voice_integrity', score: 1, gap: 6 },
          { name: 'specificity_evidence', score: 0.5, gap: 6.5 }
        ]
      },
      teaching: {
        topIssues: [{
          id: 'i14',
          title: 'Develop Complete Narrative',
          severity: 'critical',
          fromDraft: 'Music is important to me',
          principle: 'Show, don\'t tell',
          impactOnScore: 'Could improve NQI by 25+ points',
          problem: 'This is a statement, not a story',
          whyMatters: 'Admissions officers need to see specific experiences',
          suggestions: ['Describe one moment at the piano that mattered'],
          hasReflectionPrompts: true
        }],
        quickWins: []
      },
      history: { totalVersions: 1, improvementTrend: 'initial draft' },
      reflection: { totalCount: 5, completionPercentage: 0 }
    },
    question: 'How do I make this better?',
    expectedQualities: [
      'Gentle and foundational',
      'Start with meaning',
      'Specific moment',
      'Build from there',
      'Not overwhelming'
    ]
  },
  {
    id: 'test-15',
    name: 'Near-Perfect (91/100) - Seeking Validation',
    context: {
      activity: { name: 'Mental Health Advocacy', role: 'Club President', category: 'Mental Health' },
      analysis: {
        nqi: 91,
        tier: 'excellent',
        delta: 0,
        initialNqi: 91,
        weakCategories: []
      },
      teaching: {
        topIssues: [],
        quickWins: []
      },
      history: { totalVersions: 7, improvementTrend: 'excellent trajectory' },
      reflection: { totalCount: 0, completionPercentage: 0 }
    },
    question: 'Is this good enough for top schools?',
    expectedQualities: [
      'Affirming and reassuring',
      'Mentions standing out',
      'Trust this work',
      'Confidence building',
      'Don\'t second-guess'
    ]
  }
];

// ============================================================================
// RUN TESTS AND DISPLAY RESPONSES
// ============================================================================

console.log('╔═════════════════════════════════════════════════════════════════╗');
console.log('║   FULL CHAT RESPONSE TESTING WITH ACTUAL RESPONSES             ║');
console.log('║   15 scenarios with generated mock responses for analysis      ║');
console.log('╚═════════════════════════════════════════════════════════════════╝\n');

tests.forEach((test, index) => {
  console.log(`\n${'═'.repeat(75)}`);
  console.log(`TEST ${index + 1}: ${test.name}`);
  console.log(`${'═'.repeat(75)}`);

  console.log(`\n📝 SCENARIO:`);
  console.log(`   Activity: ${test.context.activity.name} (${test.context.activity.role})`);
  console.log(`   NQI Score: ${test.context.analysis.nqi}/100 (${test.context.analysis.tier})`);
  if (test.context.analysis.delta > 0) {
    console.log(`   Improvement: +${test.context.analysis.delta} points (from ${test.context.analysis.initialNqi})`);
  }
  if (test.context.teaching.topIssues.length > 0) {
    console.log(`   Top Issue: ${test.context.teaching.topIssues[0].title} (${test.context.teaching.topIssues[0].severity})`);
  }

  console.log(`\n❓ STUDENT QUESTION:`);
  console.log(`   "${test.question}"`);

  console.log(`\n🤖 CHATBOT RESPONSE:`);
  console.log(`${'─'.repeat(75)}`);
  const response = generateMockResponse(test.question, test.context);
  // Format response with proper line breaks
  response.split('\n\n').forEach(paragraph => {
    console.log(`   ${paragraph.replace(/\n/g, '\n   ')}`);
    console.log('');
  });
  console.log(`${'─'.repeat(75)}`);

  console.log(`\n✅ EXPECTED QUALITIES (Check Against Response):`);
  test.expectedQualities.forEach((quality, i) => {
    console.log(`   ${i + 1}. ${quality}`);
  });

  console.log(`\n📊 QUALITY EVALUATION:`);
  console.log(`   [ ] Conversational tone (contractions, natural speech)`);
  console.log(`   [ ] Tells story (not listing stats)`);
  console.log(`   [ ] ONE main insight + options`);
  console.log(`   [ ] Plain language (jargon translated)`);
  console.log(`   [ ] Contextual (references activity/draft)`);
  console.log(`   [ ] Appropriate length & structure`);
  console.log(`   [ ] Empathetic & supportive`);

  console.log(`\n📝 NOTES/ISSUES:`);
  console.log(`   - `);
  console.log(`   - `);
});

console.log(`\n\n${'═'.repeat(75)}`);
console.log('ANALYSIS INSTRUCTIONS:');
console.log(`${'═'.repeat(75)}`);
console.log(`
For each response above, evaluate:

1. ✅ CONVERSATIONAL TONE
   - Uses "you're", "let's", "I'd" (not "you are", "let us")
   - Starts naturally ("Let's talk about...", not "Based on analysis...")
   - Asks questions back
   - Feels like mentor, not robot

2. ✅ STORYTELLING NOT STATS
   - Numbers explained in context
   - No naked stats ("score of 15/100")
   - Weaves technical terms into narrative
   - References specific moments from draft

3. ✅ ONE QUALITY INSIGHT
   - Focuses on ONE main point first
   - Doesn't dump multiple issues
   - Deep on key opportunity
   - Then offers 2-3 other options
   - Ends with question/next step

4. ✅ PLAIN LANGUAGE
   - All technical terms translated
   - "specificity_evidence" → "adding specific details..."
   - No unexplained jargon
   - Accessible to high schoolers

5. ✅ CONTEXTUAL & SPECIFIC
   - Uses their activity name
   - Quotes their actual draft
   - Ties to their unique situation
   - Not generic advice

6. ✅ APPROPRIATE LENGTH
   - Not overwhelming
   - Well-structured paragraphs
   - Natural breaks
   - Easy to read

7. ✅ EMPATHY & SUPPORT
   - Meets them where they are
   - Encouraging without patronizing
   - Celebrates progress
   - Honest but supportive

Document any issues found and we'll iterate to improve!
`);

console.log(`${'═'.repeat(75)}\n`);
