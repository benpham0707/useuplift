import { ExtracurricularItem } from '../ExtracurricularCard';
import { WritingIssue, RubricDimension } from './types';
import { calculateDimensionScore, getStatusFromScore, generateDimensionOverview } from './rubricScorer';

// Hard coded mock draft for demonstration - this is placeholder data representing a student's extracurricular description
const MOCK_DRAFT = `I founded and led our school's Computer Science Club, organizing weekly coding workshops for beginners. Over 50 students participated throughout the year.`;

export function getMockDraft(): string {
  return MOCK_DRAFT;
}

function detectCommitmentIssues(draft: string, activity: ExtracurricularItem | undefined): WritingIssue[] {
  const issues: WritingIssue[] = [];

  const hasTimeMetrics = /\d+\s*(hours?|hrs?)\s*(per\s*week|\/week|weekly)/i.test(draft) ||
                        /\d+\s*(years?|yrs?)/i.test(draft);

  if (!hasTimeMetrics) {
    const firstSentence = draft.split('.')[0] + '.';
    const hoursPerWeek = activity?.scores?.commitment?.hoursPerWeek ?? 4;
    const weeksPerYear = activity?.scores?.commitment?.weeksPerYear ?? 36;
    const totalHours = activity?.scores?.commitment?.totalHours ?? (hoursPerWeek * weeksPerYear);
    const actName = activity?.name ?? 'this activity';
    issues.push({
      id: 'commitment_001',
      dimensionId: 'commitment',
      title: 'Missing Time Commitment Details',
      excerpt: `"${firstSentence}"`,
      analysis: 'Without specific time commitment (hours/week, duration), admissions officers can\'t gauge the depth of your involvement. Sustained commitment signals genuine interest.',
      impact: 'Time metrics instantly establish the intensity and longevity of your engagement. Without them, your activity appears less substantial than it actually is.',
      suggestions: [
        {
          text: `${actName} (${hoursPerWeek} hours/week for ${weeksPerYear} weeks/year)`,
          rationale: 'Inline parenthetical is the cleanest way to add commitment context without breaking flow.',
          type: 'replace'
        },
        {
          text: `Over ${totalHours} hours across ${Math.round(weeksPerYear / 52 * 12)} months, I led ${actName}...`,
          rationale: 'Leading with total commitment emphasizes sustained dedication.',
          type: 'replace'
        },
        {
          text: `Dedicating ${hoursPerWeek} hours weekly to ${actName}...`,
          rationale: 'Opens with commitment intensity to establish depth upfront.',
          type: 'replace'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  return issues;
}

function detectLeadershipIssues(draft: string, activity: ExtracurricularItem | undefined): WritingIssue[] {
  const issues: WritingIssue[] = [];

  const hasLeadershipLanguage = /(led|founded|organized|coordinated|managed|directed|initiated)/i.test(draft);

  if (!hasLeadershipLanguage) {
    const firstSentence = draft.split('.')[0] + '.';
    issues.push({
      id: 'leadership_001',
      dimensionId: 'leadership',
      title: 'Leadership Role Not Clear',
      excerpt: `"${firstSentence}"`,
      analysis: 'Your role and specific leadership responsibilities aren\'t explicitly stated. Officers need to see what you actually did and led.',
      impact: 'Clear leadership language demonstrates agency and initiative. Vague participation language undermines your actual contributions.',
      suggestions: [
        {
          text: `As ${activity?.role || 'captain/director'}, I led ${activity?.organization || 'our team'}'s efforts to...`,
          rationale: 'Leads with your title and active leadership verb.',
          type: 'replace'
        },
        {
          text: `I founded and directed ${activity?.name || 'the program'}, personally organizing...`,
          rationale: 'Strong founder/director framing establishes clear ownership.',
          type: 'replace'
        },
        {
          text: `In my role as ${activity?.role || 'lead'}, I coordinated...`,
          rationale: 'Explicitly names your position before describing actions.',
          type: 'replace'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  return issues;
}

function detectImpactIssues(draft: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  const hasQuantifiedImpact = /\d+\s*(students?|people|participants?|members?|users?)/i.test(draft) ||
                              /\d+%\s*(increase|growth|improvement)/i.test(draft);

  if (!hasQuantifiedImpact) {
    const sentences = draft.split('.').filter(s => s.trim());
    const excerpt = sentences.length > 1 ? `${sentences[0]}. ${sentences[1]}.` : `${sentences[0]}.`;

    issues.push({
      id: 'impact_001',
      dimensionId: 'impact',
      title: 'Impact Not Quantified',
      excerpt: `"${excerpt}"`,
      analysis: 'Your draft mentions activities but doesn\'t quantify the reach or impact. Numbers make outcomes concrete and credible.',
      impact: 'Quantified impact (# of people served, % growth, measurable outcomes) provides objective evidence of your effectiveness.',
      suggestions: [
        {
          text: '...serving 50+ students with weekly coding workshops, achieving 85% retention rate.',
          rationale: 'Adds specific numbers for reach and engagement quality.',
          type: 'insert_after'
        },
        {
          text: 'which reached 75 beginners across 3 grade levels with 90% attendance.',
          rationale: 'Quantifies both scale and sustained engagement.',
          type: 'insert_after'
        },
        {
          text: 'resulting in 12 students advancing to competitive programming teams.',
          rationale: 'Shows downstream outcomes as evidence of quality.',
          type: 'insert_after'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  return issues;
}

function detectSpecificityIssues(draft: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  const buzzwords = ['passionate', 'dedicated', 'committed', 'amazing', 'incredible', 'transformative', 'inspiring'];
  const foundBuzzwords = buzzwords.filter(word => draft.toLowerCase().includes(word));

  if (foundBuzzwords.length > 0) {
    const buzzword = foundBuzzwords[0];
    const sentences = draft.split('.');
    const sentenceWithBuzzword = sentences.find(s => s.toLowerCase().includes(buzzword));
    const excerpt = sentenceWithBuzzword ? `"${sentenceWithBuzzword.trim()}."` : `"${draft.split('.')[0]}."`;

    issues.push({
      id: 'specificity_001',
      dimensionId: 'specificity',
      title: 'Vague Language Instead of Specifics',
      excerpt,
      analysis: `The word "${buzzword}" is an adjective without supporting detail. Admissions officers prefer concrete actions and outcomes over evaluative language.`,
      impact: 'Vague descriptors slow credibility. Specific actions, concrete outcomes, and technical details build trust faster.',
      suggestions: [
        {
          text: 'organizing 25 weekly Python workshops with custom curriculum materials',
          rationale: 'Replaces adjective with specific actions and concrete details.',
          type: 'replace'
        },
        {
          text: 'developing a structured 10-week coding curriculum that progressed from basics to projects',
          rationale: 'Specific program structure demonstrates planning and execution.',
          type: 'replace'
        },
        {
          text: 'creating hands-on projects including a Discord bot and web scraper that members built',
          rationale: 'Tangible outputs provide evidence of what members actually learned.',
          type: 'replace'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  return issues;
}

function detectReflectionIssues(draft: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  const reflectionWords = ['learned', 'realized', 'discovered', 'understand', 'taught me', 'showed me', 'revealed', 'grew'];
  const hasReflection = reflectionWords.some(word => draft.toLowerCase().includes(word));

  if (!hasReflection) {
    const lastSentence = draft.split('.').filter(s => s.trim()).pop() || draft;
    issues.push({
      id: 'reflection_001',
      dimensionId: 'reflection',
      title: 'Missing Personal Growth or Learning',
      excerpt: `"${lastSentence}."`,
      analysis: 'Your draft describes what you did and the results, but doesn\'t include reflection about what you learned or how you grew as a leader.',
      impact: 'Selective admissions rewards metacognition. A single reflective insight demonstrates maturity and self-awareness that officers actively seek.',
      suggestions: [
        {
          text: '...teaching me that effective leadership requires meeting people where they are, not where you want them to be.',
          rationale: 'Leadership learning insight shows personal growth from experience.',
          type: 'insert_after'
        },
        {
          text: 'Through this role, I learned that sustainable programs require both initial enthusiasm and systematic structure for retention.',
          rationale: 'Metacognitive reflection on program-building shows systems thinking.',
          type: 'insert_after'
        },
        {
          text: 'This experience revealed that teaching others deepened my own understanding—explaining concepts forced me to truly master fundamentals.',
          rationale: 'Learning-through-teaching insight demonstrates intellectual curiosity.',
          type: 'insert_after'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  return issues;
}

export function detectAllIssuesWithRubric(draft: string, activity: ExtracurricularItem): RubricDimension[] {
  const dimensions: RubricDimension[] = [];

  // Dimension 1: Commitment & Duration
  const commitmentIssues = detectCommitmentIssues(draft, activity);
  const commitmentScore = calculateDimensionScore(commitmentIssues);
  dimensions.push({
    id: 'commitment',
    name: 'Commitment & Duration',
    score: commitmentScore,
    maxScore: 10,
    status: getStatusFromScore(commitmentScore),
    overview: generateDimensionOverview('commitment', commitmentScore, commitmentIssues.length),
    weight: 0.20,
    issues: commitmentIssues
  });

  // Dimension 2: Leadership & Role
  const leadershipIssues = detectLeadershipIssues(draft, activity);
  const leadershipScore = calculateDimensionScore(leadershipIssues);
  dimensions.push({
    id: 'leadership',
    name: 'Leadership & Role',
    score: leadershipScore,
    maxScore: 10,
    status: getStatusFromScore(leadershipScore),
    overview: generateDimensionOverview('leadership', leadershipScore, leadershipIssues.length),
    weight: 0.25,
    issues: leadershipIssues
  });

  // Dimension 3: Impact & Outcomes
  const impactIssues = detectImpactIssues(draft);
  const impactScore = calculateDimensionScore(impactIssues);
  dimensions.push({
    id: 'impact',
    name: 'Impact & Outcomes',
    score: impactScore,
    maxScore: 10,
    status: getStatusFromScore(impactScore),
    overview: generateDimensionOverview('impact', impactScore, impactIssues.length),
    weight: 0.25,
    issues: impactIssues
  });

  // Dimension 4: Specificity & Evidence
  const specificityIssues = detectSpecificityIssues(draft);
  const specificityScore = calculateDimensionScore(specificityIssues);
  dimensions.push({
    id: 'specificity',
    name: 'Specificity & Evidence',
    score: specificityScore,
    maxScore: 10,
    status: getStatusFromScore(specificityScore),
    overview: generateDimensionOverview('specificity', specificityScore, specificityIssues.length),
    weight: 0.20,
    issues: specificityIssues
  });

  // Dimension 5: Reflection & Growth
  const reflectionIssues = detectReflectionIssues(draft);
  const reflectionScore = calculateDimensionScore(reflectionIssues);
  dimensions.push({
    id: 'reflection',
    name: 'Reflection & Growth',
    score: reflectionScore,
    maxScore: 10,
    status: getStatusFromScore(reflectionScore),
    overview: generateDimensionOverview('reflection', reflectionScore, reflectionIssues.length),
    weight: 0.10,
    issues: reflectionIssues
  });

  return dimensions;
}
