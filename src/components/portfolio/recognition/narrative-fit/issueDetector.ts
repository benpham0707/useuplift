import { RecognitionItem } from '../RecognitionCard';
import { WritingIssue } from './types';

// Hard coded mock draft for demonstration
const MOCK_DRAFT = `I led platform design and school partnerships. 118 students received weekly support. This recognition validates my work in the community.`;

export function detectAllIssues(draft: string, recognition: RecognitionItem): WritingIssue[] {
  const issues: WritingIssue[] = [];
  
  // Issue 1: Missing Selectivity Context
  if (recognition.selectivity && !draft.toLowerCase().includes('top') && !draft.includes('%')) {
    issues.push({
      id: 'selectivity_001',
      category: 'selectivity',
      title: 'Missing Selectivity Context',
      excerpt: `"${recognition.name}"`,
      explanation: 'Without competitive context, admissions officers can\'t quickly calibrate the rigor and selectivity of this recognition.',
      whyItMatters: 'Selectivity metrics (Top X of Y, acceptance rate) instantly establish credibility and help officers understand how competitive this achievement was.',
      suggestions: [
        {
          text: `${recognition.name} (Top ${recognition.selectivity.accepted} of ${recognition.selectivity.applicants})`,
          rationale: 'Inline parenthetical is the cleanest way to add context without breaking flow.'
        },
        {
          text: `Selected as 1 of ${recognition.selectivity.accepted} finalists from ${recognition.selectivity.applicants} applicants for the ${recognition.name}.`,
          rationale: 'Full sentence version emphasizes the selection process and competitive pool.'
        },
        {
          text: `${recognition.name} — a ${(recognition.selectivity.acceptanceRate * 100).toFixed(1)}% acceptance rate recognition`,
          rationale: 'Percentage format helps officers immediately understand selectivity level.'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  // Issue 2: Theme Not Explicit
  if (!draft.toLowerCase().includes('stem') && !draft.toLowerCase().includes('community impact') && !draft.toLowerCase().includes('narrative')) {
    issues.push({
      id: 'theme_002',
      category: 'theme',
      title: 'Theme Connection Not Explicit',
      excerpt: findOpeningSentence(draft),
      explanation: 'Your draft doesn\'t explicitly connect this recognition to your overarching narrative theme. Officers shouldn\'t have to infer the connection.',
      whyItMatters: 'Making your academic spine explicit helps officers quickly understand how this achievement fits into your broader story and validates your core narrative.',
      suggestions: [
        {
          text: 'This recognition directly reinforces my STEM + Community Impact narrative by validating technical execution and social mission alignment.',
          rationale: 'Direct statement naming your theme upfront establishes immediate thematic clarity.'
        },
        {
          text: 'As a reflection of my core focus on technology-driven community solutions, this recognition...',
          rationale: 'Opens with thematic framing before diving into recognition details.'
        },
        {
          text: '...which aligns perfectly with my demonstrated commitment to using STEM skills for measurable community impact.',
          rationale: 'Closing sentence version ties the recognition back to your narrative spine.'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  // Issue 3: Missing Cause→Effect
  if (!draft.includes('which led to') && !draft.includes('resulted in') && !draft.includes('which enabled') && !draft.includes('leading to')) {
    issues.push({
      id: 'causality_003',
      category: 'causality',
      title: 'Missing Cause→Effect Connection',
      excerpt: `"I led platform design and school partnerships. 118 students received weekly support."`,
      explanation: 'Your draft lists actions and outcomes separately but doesn\'t connect them causally. Officers need to see: "I did X, which led to Y outcome."',
      whyItMatters: 'Causal language (resulted in, which led to, enabling) demonstrates evidence-based thinking and helps officers quickly understand your efficacy and impact.',
      suggestions: [
        {
          text: 'I led platform design and school partnerships, which resulted in 118 students receiving weekly support and a 12-point retention increase.',
          rationale: 'Adds "which resulted in" to explicitly connect your actions to measurable outcomes.'
        },
        {
          text: 'My leadership in platform design and school partnerships enabled weekly support for 118 students, driving improved retention.',
          rationale: 'Uses "enabled" as a strong causal connector emphasizing your agency.'
        },
        {
          text: 'Leading platform design and partnership development resulted in scaling support to 118 students with measurable retention gains.',
          rationale: 'Opens with action, uses "resulted in" to show direct causation to scale and impact.'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  // Issue 4: No Reflection/Learning
  if (!draft.toLowerCase().includes('learned') && !draft.toLowerCase().includes('realized') && !draft.toLowerCase().includes('discovered') && !draft.toLowerCase().includes('understand')) {
    issues.push({
      id: 'reflection_004',
      category: 'reflection',
      title: 'Missing Reflection or Learning',
      excerpt: findClosingSentence(draft),
      explanation: 'Your draft describes what you did and the results, but doesn\'t include any metacognitive reflection about what you learned or how you grew.',
      whyItMatters: 'Selective admissions rewards metacognition. A single reflective clause demonstrates intellectual maturity and self-awareness that officers actively look for.',
      suggestions: [
        {
          text: '...teaching me that sustainable community impact requires both technical excellence and deep stakeholder relationships.',
          rationale: 'Closing reflection connects technical and social dimensions of learning.'
        },
        {
          text: 'This experience helped me understand that scale and quality aren\'t opposing forces—they require intentional systems design.',
          rationale: 'Metacognitive insight about systems thinking shows intellectual growth.'
        },
        {
          text: 'Through this work, I learned to balance rapid iteration with stakeholder trust-building, a tension I\'ll carry into future work.',
          rationale: 'Forward-looking reflection shows you\'re applying learning to future endeavors.'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  // Issue 5: Buzzwords Without Evidence
  const buzzwords = ['passionate', 'world-class', 'innovative', 'impactful', 'transformative', 'groundbreaking'];
  const hasBuzzword = buzzwords.some(word => draft.toLowerCase().includes(word));
  
  if (hasBuzzword) {
    const foundBuzzword = buzzwords.find(word => draft.toLowerCase().includes(word)) || 'passionate';
    issues.push({
      id: 'buzzwords_005',
      category: 'buzzwords',
      title: 'Buzzwords Without Evidence',
      excerpt: findSentenceWithWord(draft, foundBuzzword),
      explanation: `The word "${foundBuzzword}" is an adjective without supporting data. Admissions officers prefer concrete metrics over evaluative language.`,
      whyItMatters: 'Unquantified adjectives slow credibility and signal inexperience with evidence-based writing. Numbers and specifics build trust faster.',
      suggestions: [
        {
          text: 'Replace with specific metric: "serving 118 students across 3 schools with 94% weekly engagement"',
          rationale: 'Numbers provide objective evidence rather than subjective evaluation.'
        },
        {
          text: 'Replace with outcome data: "resulting in a 12-point increase in semester retention rates"',
          rationale: 'Measurable outcomes are more credible than descriptive adjectives.'
        },
        {
          text: 'Replace with concrete action: "I built and deployed a platform used by 118 students weekly"',
          rationale: 'Action verbs + specifics demonstrate impact without evaluative language.'
        }
      ],
      status: 'not_fixed',
      currentSuggestionIndex: 0,
      expanded: false
    });
  }

  return issues;
}

function findOpeningSentence(draft: string): string {
  const sentences = draft.split('. ');
  return `"${sentences[0]}${sentences[0].endsWith('.') ? '' : '.'}"`;
}

function findClosingSentence(draft: string): string {
  const sentences = draft.split('. ');
  return `"${sentences[sentences.length - 1]}"`;
}

function findSentenceWithWord(draft: string, word: string): string {
  const sentences = draft.split('. ');
  const found = sentences.find(s => s.toLowerCase().includes(word.toLowerCase()));
  return found ? `"${found}${found.endsWith('.') ? '' : '.'}"` : `"${sentences[0]}."`;
}

export function getMockDraft(): string {
  return MOCK_DRAFT;
}
