// @ts-nocheck - Legacy workshop file with type mismatches
/**
 * Teaching Transformer - Backend to Teaching Issue Converter
 *
 * Transforms raw backend analysis data into pedagogical TeachingIssues
 * with examples, reflection prompts, and three-level support.
 *
 * Philosophy: Every backend issue becomes a teaching opportunity.
 */

import type {
  AnalysisReport,
  CoachingOutput,
  RubricCategoryScore,
  RubricCategory,
} from './backendTypes';
import type {
  TeachingIssue,
  TeachingCoachingOutput,
  ReflectionPrompt,
  EliteEssayExample,
} from './teachingTypes';
import { getExamplesForIssue, EXAMPLE_LIBRARY } from './exampleLibrary';

// ============================================================================
// PRINCIPLE DEFINITIONS (Teaching concepts behind each issue type)
// ============================================================================

interface PrincipleDefinition {
  name: string;
  description: string;
  why_officers_care: string;
  skill_level: 'fundamental' | 'intermediate' | 'advanced';
}

const PRINCIPLES: Record<string, PrincipleDefinition> = {
  ANCHOR_WITH_NUMBERS: {
    name: 'Anchor Claims with Concrete Numbers',
    description:
      'Use specific, plausible metrics to establish credibility. Numbers transform abstract claims ("helped many people") into concrete evidence ("served 47 families"). This grounds your story in reality.',
    why_officers_care:
      'Admissions officers read thousands of vague claims. Specific numbers immediately signal authenticity and real impact.',
    skill_level: 'fundamental',
  },
  SHOW_VULNERABILITY: {
    name: 'Show Authentic Vulnerability',
    description:
      'Reveal genuine struggles, failures, or doubts. Elite essays don\'t present perfect people - they show real humans wrestling with real challenges. Include physical symptoms, named emotions, or before/after transformation.',
    why_officers_care:
      'Officers seek students who can handle setbacks and grow from them. Vulnerability demonstrates self-awareness and resilience.',
    skill_level: 'intermediate',
  },
  USE_DIALOGUE: {
    name: 'Use Dialogue to Reveal Character',
    description:
      'Incorporate brief, natural dialogue that reveals personality and relationships. Dialogue makes essays cinematic and memorable. It should sound conversational, not formal.',
    why_officers_care:
      'Dialogue shows how you interact with others and brings your voice to life. It\'s one of the strongest authenticity markers.',
    skill_level: 'intermediate',
  },
  SHOW_TRANSFORMATION: {
    name: 'Show Community Transformation',
    description:
      'Paint a clear before/after picture of how you changed your community. Use contrast to show the gap between what was and what you created. Make the reader feel the difference.',
    why_officers_care:
      'Impact matters, but transformation is what separates good applicants from great ones. Officers want to see you as a change agent.',
    skill_level: 'advanced',
  },
  UNIVERSAL_INSIGHT: {
    name: 'Transcend to Universal Insight',
    description:
      'Move from your specific experience to a broader human truth. The best essays use a concrete activity as a lens to explore timeless questions about purpose, connection, or meaning.',
    why_officers_care:
      'This shows intellectual depth and maturity. Officers want students who can think beyond the immediate and connect to bigger ideas.',
    skill_level: 'advanced',
  },
  ADD_SPECIFICITY: {
    name: 'Replace Generic with Specific',
    description:
      'Every vague word is an opportunity for specificity. "Worked on robotics" → "Debugged PID controllers for our drivetrain." Specificity = authenticity.',
    why_officers_care:
      'Generic language suggests you didn\'t actually do the work or don\'t understand it deeply. Specificity proves expertise.',
    skill_level: 'fundamental',
  },
  ACTIVE_VOICE: {
    name: 'Use Active Voice for Agency',
    description:
      'Passive voice ("The project was completed") hides agency. Active voice ("I completed the project") shows ownership. Your essays should spotlight YOUR actions.',
    why_officers_care:
      'Officers need to see what YOU did, not what happened around you. Active voice demonstrates leadership and initiative.',
    skill_level: 'fundamental',
  },
  SENSORY_DETAILS: {
    name: 'Add Sensory Immersion',
    description:
      'Include what you saw, heard, smelled, touched, or tasted. Sensory details transport the reader into your moment. "Hot metal smell," "rough calluses," "pre-dawn cold."',
    why_officers_care:
      'Sensory details are authenticity markers - you can\'t fake them. They make essays vivid and memorable.',
    skill_level: 'intermediate',
  },
  NARRATIVE_ARC: {
    name: 'Build Clear Narrative Arc',
    description:
      'Structure your essay with setup, conflict, and resolution. Even a short essay needs stakes - something had to be uncertain or at risk.',
    why_officers_care:
      'Good storytelling keeps officers engaged. Without stakes, essays feel like lists of accomplishments.',
    skill_level: 'intermediate',
  },
  DEEPEN_REFLECTION: {
    name: 'Deepen Your Reflection',
    description:
      'Move beyond "I learned..." to show HOW the experience changed your thinking or actions. What do you notice now that you didn\'t before? What questions does it raise?',
    why_officers_care:
      'Surface reflection is common. Deep reflection shows genuine growth and self-awareness.',
    skill_level: 'advanced',
  },
};

// ============================================================================
// REFLECTION PROMPT GENERATORS
// ============================================================================

function generateReflectionPrompts(
  principleKey: string,
  issueContext: string
): ReflectionPrompt[] {
  const basePrompts: Record<string, ReflectionPrompt[]> = {
    ANCHOR_WITH_NUMBERS: [
      {
        question: 'What specific numbers can you add to make this claim more concrete?',
        purpose: 'Help you identify measurable impact from your experience',
        answer_type: 'short_text',
        validation: {
          min_length: 10,
          required: true,
          helpful_hint: 'Think: How many people? How much time? What measurable outcomes?',
        },
      },
      {
        question: 'Are these numbers believable? Would someone trust them?',
        purpose: 'Ensure your metrics feel authentic, not inflated',
        answer_type: 'multiple_choice',
        options: [
          'Yes, they\'re specific and plausible',
          'Maybe, but I should verify them',
          'No, they might seem exaggerated',
        ],
        validation: { required: true },
      },
    ],
    SHOW_VULNERABILITY: [
      {
        question: 'What was a specific moment where you struggled or felt uncertain?',
        purpose: 'Identify authentic vulnerability to share',
        answer_type: 'long_text',
        validation: {
          min_length: 50,
          required: true,
          helpful_hint:
            'Describe a real moment - what you felt, what you thought, what scared you.',
        },
      },
      {
        question: 'What physical symptom or emotion did you experience?',
        purpose: 'Add concrete sensory details to vulnerability',
        answer_type: 'short_text',
        validation: { min_length: 15, helpful_hint: 'Examples: "hands shaking," "stomach dropping," "couldn\'t sleep"' },
      },
    ],
    USE_DIALOGUE: [
      {
        question: 'Who could you quote directly? What did they say that mattered?',
        purpose: 'Find natural dialogue from your experience',
        answer_type: 'long_text',
        validation: {
          min_length: 30,
          helpful_hint: 'Write the actual words - keep it short and conversational',
        },
      },
    ],
    SHOW_TRANSFORMATION: [
      {
        question: 'What was the "before" state? Describe what existed before you.',
        purpose: 'Establish baseline to show change',
        answer_type: 'short_text',
        validation: { min_length: 20, required: true },
      },
      {
        question: 'What is the "after" state? What changed because of you?',
        purpose: 'Show the transformation you created',
        answer_type: 'short_text',
        validation: { min_length: 20, required: true },
      },
    ],
    UNIVERSAL_INSIGHT: [
      {
        question: 'What bigger question does your experience raise about life, learning, or humanity?',
        purpose: 'Move from specific to universal',
        answer_type: 'long_text',
        validation: {
          min_length: 40,
          helpful_hint:
            'Think beyond your activity - what truth about people or the world did you discover?',
        },
      },
    ],
  };

  return basePrompts[principleKey] || [
    {
      question: `How can you apply the "${principleKey}" principle to improve this section?`,
      purpose: 'Guide you to implement the principle in your own words',
      answer_type: 'long_text',
      validation: { min_length: 50, required: true },
    },
  ];
}

// ============================================================================
// ISSUE SEVERITY DETERMINATION
// ============================================================================

function determineSeverity(
  category: RubricCategory,
  score: number,
  maxScore: number,
  impact: string
): 'critical' | 'major' | 'minor' {
  const percentage = (score / maxScore) * 100;

  // Critical: Low score (<55%) on high-weight categories
  if (percentage < 55 && impact.includes('Costing you')) return 'critical';

  // Major: Medium score (55-70%) or clear negative impact
  if (percentage < 70 || impact.includes('major')) return 'major';

  // Minor: Everything else
  return 'minor';
}

// ============================================================================
// PRINCIPLE MAPPING (Category + Issue Type → Principle)
// ============================================================================

function determinePrinciple(
  category: RubricCategory,
  issueText: string,
  suggestions: string[]
): string {
  const text = issueText.toLowerCase() + ' ' + suggestions.join(' ').toLowerCase();

  // Match keywords to principles
  if (text.includes('number') || text.includes('metric') || text.includes('quantif'))
    return 'ANCHOR_WITH_NUMBERS';
  if (text.includes('vulnerab') || text.includes('struggl') || text.includes('challeng'))
    return 'SHOW_VULNERABILITY';
  if (text.includes('dialogue') || text.includes('conversation') || text.includes('said'))
    return 'USE_DIALOGUE';
  if (text.includes('transformation') || text.includes('community') || text.includes('before'))
    return 'SHOW_TRANSFORMATION';
  if (text.includes('insight') || text.includes('universal') || text.includes('meaning'))
    return 'UNIVERSAL_INSIGHT';
  if (text.includes('specific') || text.includes('vague') || text.includes('generic'))
    return 'ADD_SPECIFICITY';
  if (text.includes('passive') || text.includes('active voice')) return 'ACTIVE_VOICE';
  if (text.includes('sensory') || text.includes('detail') || text.includes('vivid'))
    return 'SENSORY_DETAILS';
  if (text.includes('arc') || text.includes('structure') || text.includes('narrative'))
    return 'NARRATIVE_ARC';
  if (text.includes('reflection') || text.includes('meaning') || text.includes('learn'))
    return 'DEEPEN_REFLECTION';

  // Category-based defaults
  if (category === 'specificity_evidence') return 'ADD_SPECIFICITY';
  if (category === 'transformative_impact') return 'SHOW_TRANSFORMATION';
  if (category === 'reflection_meaning') return 'DEEPEN_REFLECTION';
  if (category === 'voice_integrity') return 'USE_DIALOGUE';

  return 'ADD_SPECIFICITY'; // Safe default
}

// ============================================================================
// MAIN TRANSFORMER
// ============================================================================

export function transformToTeachingIssue(
  categoryScore: RubricCategoryScore,
  priorityRank: number,
  draftText: string
): TeachingIssue | null {
  // Only create teaching issues for categories with suggestions
  if (!categoryScore.suggestions || categoryScore.suggestions.length === 0) return null;

  const principleKey = determinePrinciple(
    categoryScore.category,
    categoryScore.comments?.join(' ') || '',
    categoryScore.suggestions
  );
  const principle = PRINCIPLES[principleKey];

  // Extract excerpt from evidence or comments
  const excerpt =
    categoryScore.evidence?.[0] ||
    draftText.substring(0, 150) + '...';

  const severity = determineSeverity(
    categoryScore.category,
    categoryScore.score,
    categoryScore.maxScore,
    categoryScore.suggestions[0]
  );

  // Get examples from library
  const examples = getExamplesForIssue(categoryScore.category, principleKey, 3);

  const issue: TeachingIssue = {
    id: `issue-${categoryScore.category}-${Date.now()}`,
    category: categoryScore.category,
    rubric_category: categoryScore.category, // ADD THIS - for matching in UI
    severity,
    problem: {
      title: `${categoryScore.category.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}: Needs Improvement`,
      from_draft: excerpt,
      explanation: categoryScore.comments?.[0] || categoryScore.suggestions[0],
      impact_on_score: `Improving this could add +${Math.ceil((categoryScore.maxScore - categoryScore.score) * 2)}-${Math.ceil((categoryScore.maxScore - categoryScore.score) * 3)} points`,
    },
    principle: {
      name: principle.name,
      description: principle.description,
      why_officers_care: principle.why_officers_care,
      skill_level: principle.skill_level,
    },
    examples,
    reflection_prompts: generateReflectionPrompts(principleKey, excerpt),
    student_workspace: {
      draft_text: '',
      is_complete: false,
    },
    support: {
      current_level: 'teach',
    },
    status: 'not_started',
    priority_rank: priorityRank,
  };

  return issue;
}

export function transformAnalysisToCoaching(
  analysis: AnalysisReport,
  backendCoaching: CoachingOutput | null,
  draftText: string
): TeachingCoachingOutput {
  // Convert rubric categories to teaching issues
  const teachingIssues: TeachingIssue[] = [];
  let priorityRank = 1;

  // Sort categories by score (lowest first = highest priority)
  const sortedCategories = [...analysis.categories].sort((a, b) => {
    const aPercentage = (a.score / a.maxScore) * 100;
    const bPercentage = (b.score / b.maxScore) * 100;
    return aPercentage - bPercentage;
  });

  for (const categoryScore of sortedCategories) {
    const issue = transformToTeachingIssue(categoryScore, priorityRank, draftText);
    if (issue) {
      teachingIssues.push(issue);
      priorityRank++;
    }
  }

  // Identify quick wins (high impact, simpler principles)
  const quickWins = teachingIssues
    .filter((issue) => {
      if (!issue.problem?.explanation) return false;
      return (
        issue.severity === 'critical' &&
        ['ANCHOR_WITH_NUMBERS', 'ADD_SPECIFICITY', 'ACTIVE_VOICE'].includes(
          determinePrinciple(issue.category, issue.problem.explanation, [])
        )
      );
    })
    .slice(0, 3)
    .map((issue) => ({
      issue_id: issue.id,
      title: issue.problem?.title || 'Issue',
      effort: 'low' as const,
      impact: issue.problem?.impact_on_score || 'medium',
      estimated_minutes: 10,
    }));

  // Build strategic guidance
  const strengths: string[] = [];
  const gaps: string[] = [];

  analysis.categories.forEach((cat) => {
    const percentage = (cat.score / cat.maxScore) * 100;
    const categoryName = cat.category
      .split('_')
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join(' ');

    if (percentage >= 85) {
      strengths.push(`Strong ${categoryName}`);
    } else if (percentage < 55) {
      gaps.push(`${categoryName} needs significant work`);
    }
  });

  // Calculate target NQI
  const currentNQI = analysis.narrative_quality_index;
  const potentialGain = teachingIssues.reduce((sum, issue) => {
    const match = issue.problem.impact_on_score.match(/\+(\d+)-(\d+)/);
    return sum + (match ? parseInt(match[1]) : 3);
  }, 0);
  const targetNQI = Math.min(100, currentNQI + potentialGain);

  return {
    overall: {
      current_nqi: currentNQI,
      target_nqi: targetNQI,
      potential_gain: potentialGain,
      total_issues: teachingIssues.length,
      estimated_time_minutes: teachingIssues.length * 15,
    },
    teaching_issues: teachingIssues,
    quick_wins: quickWins,
    strategy: {
      strengths_to_maintain: strengths,
      critical_gaps: gaps,
      recommended_order: teachingIssues.map((i) => i.id),
      learning_path: gaps.length > 0
        ? `Focus first on ${gaps[0].toLowerCase()}. This is your biggest opportunity for improvement. ${quickWins.length > 0 ? `Start with the quick wins to build momentum, then tackle deeper improvements.` : ''}`
        : 'Your essay is strong overall. Focus on polish and deepening your reflection.',
    },
    projections: {
      if_all_completed: {
        estimated_nqi: targetNQI,
        confidence_range: [targetNQI - 3, Math.min(100, targetNQI + 2)],
        tier_placement: targetNQI >= 85 ? 1 : targetNQI >= 75 ? 2 : 3,
      },
      if_quick_wins_only: {
        estimated_nqi: Math.min(100, currentNQI + Math.floor(potentialGain * 0.4)),
        time_saved_minutes: (teachingIssues.length - quickWins.length) * 15,
      },
    },
  };
}
