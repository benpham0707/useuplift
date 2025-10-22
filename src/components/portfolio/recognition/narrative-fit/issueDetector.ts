import { RecognitionItem } from '../RecognitionCard';
import { WritingIssue, RubricDimension } from './types';
import { calculateDimensionScore, getStatusFromScore, generateDimensionOverview } from './rubricScorer';

// Hard coded mock draft for demonstration - this is placeholder data representing a student's recognition description
const MOCK_DRAFT = `I led platform design and school partnerships. 118 students received weekly support. This recognition validates my work in the community.`;

export function getMockDraft(): string {
  return MOCK_DRAFT;
}

function detectSelectivityIssues(draft: string, recognition: RecognitionItem): WritingIssue[] {
  const issues: WritingIssue[] = [];
  
  
  if (recognition.selectivity && !draft.toLowerCase().includes('top') && !draft.includes('%')) {
    issues.push({
      id: 'selectivity_001',
      dimensionId: 'selectivity',
      title: 'Missing Selectivity Metrics',
      excerpt: `"${recognition.name}"`,
      analysis: 'Without competitive context, admissions officers can\'t quickly calibrate the rigor and selectivity of this recognition. You need to include acceptance rates, applicant pool sizes, or selection ratios.',
      impact: 'Selectivity metrics instantly establish credibility and help officers understand how competitive this achievement was. Without them, your recognition appears less impressive than it actually is.',
      suggestions: [
        {
          text: `${recognition.name} (Top ${recognition.selectivity.accepted} of ${recognition.selectivity.applicants})`,
          rationale: 'Inline parenthetical is the cleanest way to add context without breaking narrative flow.',
          type: 'replace'
        },
        {
          text: `Selected as 1 of ${recognition.selectivity.accepted} finalists from ${recognition.selectivity.applicants} applicants for the ${recognition.name}.`,
          rationale: 'Full sentence version emphasizes the selection process and competitive pool size.',
          type: 'replace'
        },
        {
          text: `${recognition.name} — a ${(recognition.selectivity.acceptanceRate * 100).toFixed(1)}% acceptance rate recognition`,
          rationale: 'Percentage format helps officers immediately understand selectivity level at a glance.',
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

function detectThemeIssues(draft: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  
  const themeKeywords = ['stem', 'community impact', 'narrative', 'theme', 'mission', 'focus'];
  const hasExplicitTheme = themeKeywords.some(keyword => draft.toLowerCase().includes(keyword));
  
  if (!hasExplicitTheme) {
    const firstSentence = draft.split('.')[0] + '.';
    issues.push({
      id: 'theme_001',
      dimensionId: 'theme',
      title: 'Theme Connection Not Explicit',
      excerpt: `"${firstSentence}"`,
      analysis: 'Your draft doesn\'t explicitly connect this recognition to your overarching narrative theme. Officers shouldn\'t have to infer how this fits your academic story.',
      impact: 'Making your academic spine explicit helps officers quickly understand how this achievement validates your core narrative and fits into your broader "spike".',
      suggestions: [
        {
          text: 'This recognition directly reinforces my STEM + Community Impact narrative by validating both technical execution and social mission alignment.',
          rationale: 'Direct statement naming your theme upfront establishes immediate thematic clarity.',
          type: 'insert_before'
        },
        {
          text: 'As a reflection of my core focus on technology-driven community solutions, this recognition...',
          rationale: 'Opens with thematic framing before diving into recognition details.',
          type: 'replace'
        },
        {
          text: '...which aligns perfectly with my demonstrated commitment to using STEM skills for measurable community impact.',
          rationale: 'Closing sentence ties the recognition back to your narrative spine.',
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

function detectCausalityIssues(draft: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  
  const causalPhrases = ['which led to', 'resulted in', 'which enabled', 'leading to', 'enabling', 'driving'];
  const hasCausality = causalPhrases.some(phrase => draft.toLowerCase().includes(phrase));
  
  if (!hasCausality) {
    const sentences = draft.split('.').filter(s => s.trim());
    if (sentences.length >= 2) {
      const excerpt = `${sentences[0]}. ${sentences[1]}.`;
      issues.push({
        id: 'causality_001',
        dimensionId: 'causality',
        title: 'Missing Cause→Effect Connection',
        excerpt: `"${excerpt}"`,
        analysis: 'Your draft lists actions and outcomes separately but doesn\'t connect them causally. Officers need to see: "I did X, which led to Y outcome."',
        impact: 'Causal language (resulted in, which led to, enabling) demonstrates evidence-based thinking and helps officers quickly understand your efficacy and impact.',
        suggestions: [
          {
            text: draft.replace('. ', ', which resulted in '),
            rationale: 'Adds "which resulted in" to explicitly connect your actions to measurable outcomes.',
            type: 'replace'
          },
          {
            text: draft.replace('. ', ', enabling '),
            rationale: 'Uses "enabling" as a strong causal connector emphasizing your agency.',
            type: 'replace'
          },
          {
            text: draft.replace('. ', ', ultimately driving '),
            rationale: 'Uses "driving" to show direct causation and leadership in creating outcomes.',
            type: 'replace'
          }
        ],
        status: 'not_fixed',
        currentSuggestionIndex: 0,
        expanded: false
      });
    }
  }
  
  return issues;
}

function detectEvidenceIssues(draft: string): WritingIssue[] {
  const issues: WritingIssue[] = [];

  
  const buzzwords = ['passionate', 'world-class', 'innovative', 'impactful', 'transformative', 'groundbreaking', 'amazing', 'incredible'];
  const foundBuzzwords = buzzwords.filter(word => draft.toLowerCase().includes(word));
  
  if (foundBuzzwords.length > 0) {
    const buzzword = foundBuzzwords[0];
    const sentences = draft.split('.');
    const sentenceWithBuzzword = sentences.find(s => s.toLowerCase().includes(buzzword));
    const excerpt = sentenceWithBuzzword ? `"${sentenceWithBuzzword.trim()}."` : `"${draft.split('.')[0]}."`;
    
    issues.push({
      id: 'evidence_001',
      dimensionId: 'evidence',
      title: 'Buzzwords Without Evidence',
      excerpt,
      analysis: `The word "${buzzword}" is an adjective without supporting data. Admissions officers prefer concrete metrics over evaluative language.`,
      impact: 'Unquantified adjectives slow credibility and signal inexperience with evidence-based writing. Numbers and specifics build trust faster.',
      suggestions: [
        {
          text: 'serving 118 students across 3 schools with 94% weekly engagement',
          rationale: 'Numbers provide objective evidence rather than subjective evaluation.',
          type: 'replace'
        },
        {
          text: 'resulting in a 12-point increase in semester retention rates',
          rationale: 'Measurable outcomes are more credible than descriptive adjectives.',
          type: 'replace'
        },
        {
          text: 'built and deployed a platform used by 118 students weekly',
          rationale: 'Action verbs + specifics demonstrate impact without evaluative language.',
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

  
  const reflectionWords = ['learned', 'realized', 'discovered', 'understand', 'taught me', 'showed me', 'revealed'];
  const hasReflection = reflectionWords.some(word => draft.toLowerCase().includes(word));
  
  if (!hasReflection) {
    const lastSentence = draft.split('.').filter(s => s.trim()).pop() || draft;
    issues.push({
      id: 'reflection_001',
      dimensionId: 'reflection',
      title: 'Missing Reflection or Learning',
      excerpt: `"${lastSentence}."`,
      analysis: 'Your draft describes what you did and the results, but doesn\'t include any metacognitive reflection about what you learned or how you grew.',
      impact: 'Selective admissions rewards metacognition. A single reflective clause demonstrates intellectual maturity and self-awareness that officers actively look for.',
      suggestions: [
        {
          text: '...teaching me that sustainable community impact requires both technical excellence and deep stakeholder relationships.',
          rationale: 'Closing reflection connects technical and social dimensions of learning.',
          type: 'insert_after'
        },
        {
          text: 'This experience helped me understand that scale and quality aren\'t opposing forces—they require intentional systems design.',
          rationale: 'Metacognitive insight about systems thinking shows intellectual growth.',
          type: 'insert_after'
        },
        {
          text: 'Through this work, I learned to balance rapid iteration with stakeholder trust-building, a tension I\'ll carry into future endeavors.',
          rationale: 'Forward-looking reflection shows you\'re applying learning to future work.',
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

export function detectAllIssuesWithRubric(draft: string, recognition: RecognitionItem): RubricDimension[] {
  const dimensions: RubricDimension[] = [];
  
  // Dimension 1: Selectivity & Context
  const selectivityIssues = detectSelectivityIssues(draft, recognition);
  const selectivityScore = calculateDimensionScore(selectivityIssues);
  dimensions.push({
    id: 'selectivity',
    name: 'Selectivity & Context',
    score: selectivityScore,
    maxScore: 10,
    status: getStatusFromScore(selectivityScore),
    overview: generateDimensionOverview('selectivity', selectivityScore, selectivityIssues.length),
    weight: 0.20,
    issues: selectivityIssues
  });
  
  // Dimension 2: Thematic Connection
  const themeIssues = detectThemeIssues(draft);
  const themeScore = calculateDimensionScore(themeIssues);
  dimensions.push({
    id: 'theme',
    name: 'Thematic Connection',
    score: themeScore,
    maxScore: 10,
    status: getStatusFromScore(themeScore),
    overview: generateDimensionOverview('theme', themeScore, themeIssues.length),
    weight: 0.25,
    issues: themeIssues
  });
  
  // Dimension 3: Causality & Impact
  const causalityIssues = detectCausalityIssues(draft);
  const causalityScore = calculateDimensionScore(causalityIssues);
  dimensions.push({
    id: 'causality',
    name: 'Causality & Impact',
    score: causalityScore,
    maxScore: 10,
    status: getStatusFromScore(causalityScore),
    overview: generateDimensionOverview('causality', causalityScore, causalityIssues.length),
    weight: 0.25,
    issues: causalityIssues
  });
  
  // Dimension 4: Evidence & Specificity
  const evidenceIssues = detectEvidenceIssues(draft);
  const evidenceScore = calculateDimensionScore(evidenceIssues);
  dimensions.push({
    id: 'evidence',
    name: 'Evidence & Specificity',
    score: evidenceScore,
    maxScore: 10,
    status: getStatusFromScore(evidenceScore),
    overview: generateDimensionOverview('evidence', evidenceScore, evidenceIssues.length),
    weight: 0.20,
    issues: evidenceIssues
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
