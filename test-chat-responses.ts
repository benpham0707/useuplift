/**
 * Comprehensive Chat Response Testing Suite
 *
 * Tests 15 different scenarios with varied:
 * - Narrative quality levels (weak to excellent)
 * - Question types (score, priority, fix, progress, etc.)
 * - Student contexts (different activities, issues, scores)
 */

import { buildWorkshopChatContext, WorkshopChatContext } from './src/services/workshop/chatContext';
import { ExtracurricularItem } from './src/components/portfolio/extracurricular/ExtracurricularCard';
import { AnalysisResult } from './src/components/portfolio/extracurricular/workshop/backendTypes';
import { TeachingCoachingOutput } from './src/components/portfolio/extracurricular/workshop/teachingTypes';

// ============================================================================
// TEST SCENARIOS
// ============================================================================

interface TestScenario {
  id: string;
  name: string;
  activity: ExtracurricularItem;
  draft: string;
  analysis: AnalysisResult;
  teaching: TeachingCoachingOutput;
  question: string;
  expectedTone: string;
  expectedElements: string[];
}

const scenarios: TestScenario[] = [
  // Test 1: Very low score (15/100) - needs fundamental work
  {
    id: 'test-1',
    name: 'Very Weak Narrative - Score Question',
    activity: {
      id: 'act-1',
      name: 'Debate Team',
      role: 'Member',
      category: 'Academic',
      timeCommitment: { hours: 5, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Developed speaking skills'
    },
    draft: 'I was on the debate team. We practiced and went to tournaments. I learned a lot about public speaking and arguments.',
    analysis: {
      nqi: 15,
      scores: [
        { name: 'reflection_meaning', score: 0.5, gap: 6.5, weight: 1.2 },
        { name: 'narrative_arc_stakes', score: 1, gap: 6, weight: 1.3 },
        { name: 'specificity_evidence', score: 2, gap: 5, weight: 1.4 }
      ],
      tier: 'weak',
      authenticity: { verySpecific: false, mentionsNumbers: false, usesVagueLanguage: true }
    },
    teaching: {
      issues: [{
        id: 'i1',
        title: 'Add Deep Personal Reflection',
        severity: 'critical',
        fromDraft: 'I learned a lot about public speaking',
        principle: 'Show transformation through reflection',
        impactOnScore: 'Could improve NQI by 15-20 points',
        problem: 'The narrative states facts but doesn\'t reflect on meaning',
        whyMatters: 'Admissions officers need to see how you grew as a person',
        suggestions: ['Describe a specific moment that changed your thinking', 'Explain what you discovered about yourself'],
        hasReflectionPrompts: true
      }]
    },
    question: 'Why is my score so low?',
    expectedTone: 'Encouraging and supportive, not judgmental',
    expectedElements: ['foundation building', 'early stages', 'specific opportunity', 'plain language explanation']
  },

  // Test 2: Low score (45/100) - has basics, needs depth
  {
    id: 'test-2',
    name: 'Basic Narrative - Priority Question',
    activity: {
      id: 'act-2',
      name: 'Community Garden Project',
      role: 'Founder',
      category: 'Community Service',
      timeCommitment: { hours: 8, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Started a garden that feeds local families'
    },
    draft: 'I started a community garden in my neighborhood. We grew vegetables and donated them to the food bank. I organized volunteers and managed the garden. Over 6 months, we donated 500 pounds of produce.',
    analysis: {
      nqi: 45,
      scores: [
        { name: 'transformative_impact', score: 4, gap: 3, weight: 1.4 },
        { name: 'emotional_maturity', score: 3, gap: 4, weight: 1.0 },
        { name: 'authentic_challenge', score: 5, gap: 2, weight: 1.2 }
      ],
      tier: 'developing',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
        id: 'i2',
        title: 'Show Personal Transformation',
        severity: 'high',
        fromDraft: 'I organized volunteers and managed the garden',
        principle: 'Move from reporting to reflecting',
        impactOnScore: 'Could improve NQI by 10-12 points',
        problem: 'You tell what you did, but not who you became',
        whyMatters: 'Elite narratives show internal growth, not just external achievements',
        suggestions: ['What surprised you about this work?', 'How did facing challenges change you?'],
        hasReflectionPrompts: true
      }]
    },
    question: 'What should I focus on first?',
    expectedTone: 'Acknowledging progress while pushing for depth',
    expectedElements: ['foundation in place', 'opportunity for depth', 'specific excerpt', 'next steps']
  },

  // Test 3: Medium score (68/100) - decent narrative
  {
    id: 'test-3',
    name: 'Solid Narrative - Fix/Improve Question',
    activity: {
      id: 'act-3',
      name: 'Math Tutoring Initiative',
      role: 'Lead Tutor',
      category: 'Academic',
      timeCommitment: { hours: 6, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Helped struggling students gain confidence'
    },
    draft: 'When I started tutoring middle schoolers in math, I thought I\'d just be teaching formulas. But watching Maria struggle with fractions taught me that math anxiety isn\'t about ability - it\'s about confidence. I developed a new approach focused on small wins and celebrating progress. Over the year, my students\' test scores improved by an average of 18%.',
    analysis: {
      nqi: 68,
      scores: [
        { name: 'intellectual_depth', score: 6, gap: 1, weight: 1.2 },
        { name: 'future_oriented', score: 5, gap: 2, weight: 1.1 },
        { name: 'elite_positioning', score: 6, gap: 1, weight: 1.3 }
      ],
      tier: 'competitive',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
        id: 'i3',
        title: 'Connect to Future Goals',
        severity: 'medium',
        fromDraft: 'I developed a new approach focused on small wins',
        principle: 'Link past experiences to future aspirations',
        impactOnScore: 'Could improve NQI by 5-7 points',
        problem: 'Strong reflection on the past, but no connection to your future',
        whyMatters: 'Top schools want to see how experiences shape your trajectory',
        suggestions: ['How will this approach influence your college goals?', 'What does this reveal about your future path?'],
        hasReflectionPrompts: false
      }]
    },
    question: 'How do I improve this section about my new approach?',
    expectedTone: 'Appreciative of quality while suggesting refinement',
    expectedElements: ['solid foundation', 'opportunity to go deeper', 'specific quote', 'thoughtful suggestion']
  },

  // Test 4: Good score (78/100) - strong narrative
  {
    id: 'test-4',
    name: 'Strong Narrative - Category Question',
    activity: {
      id: 'act-4',
      name: 'Robotics Team',
      role: 'Programming Lead',
      category: 'STEM',
      timeCommitment: { hours: 15, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Led team to regional championships'
    },
    draft: 'The robot failed its first autonomous run spectacularly - sensors misaligned, code crashing, wheels spinning in opposite directions. In that moment of collective disappointment, I realized leadership isn\'t about having all the answers. I gathered the team, and instead of troubleshooting alone, I asked each person to identify one failure point. By distributing ownership of the problems, we didn\'t just fix the robot - we built a team culture where failure became our best teacher. Three months later, we won regionals.',
    analysis: {
      nqi: 78,
      scores: [
        { name: 'voice_integrity', score: 8, gap: 1, weight: 1.2 },
        { name: 'narrative_craft', score: 9, gap: 0, weight: 1.0 },
        { name: 'institutional_savvy', score: 6, gap: 1, weight: 1.1 }
      ],
      tier: 'strong',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
        id: 'i4',
        title: 'Add Institutional Context',
        severity: 'low',
        fromDraft: 'we built a team culture where failure became our best teacher',
        principle: 'Show awareness of larger systems',
        impactOnScore: 'Could improve NQI by 3-5 points',
        problem: 'Great personal story, but could connect to how robotics programs work',
        whyMatters: 'Elite students understand their work in broader contexts',
        suggestions: ['How did this fit into your school\'s STEM culture?', 'What did you learn about how teams function in technical fields?'],
        hasReflectionPrompts: false
      }]
    },
    question: 'Why is my institutional_savvy score only 6?',
    expectedTone: 'Validating strength while explaining subtle gap',
    expectedElements: ['strong narrative', 'close to target', 'plain language explanation', 'specific suggestion']
  },

  // Test 5: Excellent score (88/100) - outstanding narrative
  {
    id: 'test-5',
    name: 'Excellent Narrative - Score Question',
    activity: {
      id: 'act-5',
      name: 'Immigration Legal Aid',
      role: 'Student Coordinator',
      category: 'Community Service',
      timeCommitment: { hours: 10, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Helped families navigate legal system'
    },
    draft: 'Mrs. Rodriguez\'s hands trembled as she tried to explain her situation in broken English. I was supposed to just file paperwork, but I found myself becoming a bridge - not just translating words, but translating complex legal concepts into images and stories she could understand. Each case taught me that justice isn\'t just about knowing the law; it\'s about making it accessible. This year, I\'ve coordinated intake for 47 families, but more importantly, I\'ve learned that advocacy requires both technical knowledge and profound empathy. This experience has shaped my commitment to public interest law, where I hope to build systems that are as compassionate as they are rigorous.',
    analysis: {
      nqi: 88,
      scores: [
        { name: 'voice_integrity', score: 9, gap: 0, weight: 1.2 },
        { name: 'transformative_impact', score: 9, gap: 0, weight: 1.4 },
        { name: 'holistic_excellence', score: 8, gap: 1, weight: 1.1 }
      ],
      tier: 'excellent',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: []
    },
    question: 'How is my score overall?',
    expectedTone: 'Celebratory and validating',
    expectedElements: ['excellent/outstanding', 'authentic voice', 'trust what you\'ve written', 'don\'t over-edit']
  },

  // Test 6: Progress tracking question
  {
    id: 'test-6',
    name: 'Improving Narrative - Progress Question',
    activity: {
      id: 'act-6',
      name: 'School Newspaper',
      role: 'Editor',
      category: 'Journalism',
      timeCommitment: { hours: 8, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Led editorial team'
    },
    draft: 'As editor of the school newspaper, I learned to balance truth-telling with sensitivity. When we covered the budget cuts affecting our arts program, I had to navigate between administration pressure and student voices demanding transparency.',
    analysis: {
      nqi: 62,
      scores: [],
      tier: 'developing',
      authenticity: { verySpecific: false, mentionsNumbers: false, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
        id: 'i6',
        title: 'Add Specific Examples',
        severity: 'medium',
        fromDraft: 'balance truth-telling with sensitivity',
        principle: 'Show through specific moments',
        impactOnScore: 'Could improve NQI by 8-10 points',
        problem: 'Abstract concepts need concrete examples',
        whyMatters: 'Specificity makes your story believable and compelling',
        suggestions: ['What was one specific moment of this tension?'],
        hasReflectionPrompts: true
      }]
    },
    question: 'How much have I improved?',
    expectedTone: 'Encouraging about trajectory',
    expectedElements: ['progress', 'versions', 'improvement trend', 'next milestone'],
    // Simulating improvement
    context: {
      analysis: {
        delta: 12,
        initialNqi: 50
      },
      history: {
        totalVersions: 4,
        improvementTrend: 'steadily improving'
      }
    }
  },

  // Test 7: Stuck/need help
  {
    id: 'test-7',
    name: 'Student Feeling Stuck',
    activity: {
      id: 'act-7',
      name: 'Environmental Club',
      role: 'President',
      category: 'Environmental',
      timeCommitment: { hours: 7, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Led sustainability initiatives'
    },
    draft: 'I started a recycling program at school.',
    analysis: {
      nqi: 28,
      scores: [],
      tier: 'weak',
      authenticity: { verySpecific: false, mentionsNumbers: false, usesVagueLanguage: true }
    },
    teaching: {
      issues: [{
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
      }]
    },
    question: 'I\'m stuck and don\'t know how to make this better',
    expectedTone: 'Supportive and problem-solving',
    expectedElements: ['let\'s work through this', 'reflection prompts available', 'specific help options']
  },

  // Test 8: General/vague question
  {
    id: 'test-8',
    name: 'Vague General Question',
    activity: {
      id: 'act-8',
      name: 'Theater Production',
      role: 'Stage Manager',
      category: 'Arts',
      timeCommitment: { hours: 12, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Coordinated technical aspects'
    },
    draft: 'Managing a theater production taught me that leadership happens behind the scenes. When our lead actor got sick opening night, I had to coordinate understudies, adjust lighting cues, and keep the crew calm - all while staying invisible to the audience.',
    analysis: {
      nqi: 71,
      scores: [
        { name: 'specificity_evidence', score: 6, gap: 1, weight: 1.3 }
      ],
      tier: 'strong',
      authenticity: { verySpecific: false, mentionsNumbers: false, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
        id: 'i8',
        title: 'Add More Specific Details',
        severity: 'medium',
        fromDraft: 'I had to coordinate understudies, adjust lighting cues, and keep the crew calm',
        principle: 'Specificity creates credibility',
        impactOnScore: 'Could improve NQI by 5-7 points',
        problem: 'Good story structure but needs more vivid details',
        whyMatters: 'Specific details make your experience real and memorable',
        suggestions: ['What exactly did you say to keep the crew calm?', 'What was one specific lighting cue you adjusted?'],
        hasReflectionPrompts: false
      }]
    },
    question: 'What do you think about this?',
    expectedTone: 'Conversational and exploratory',
    expectedElements: ['current status', 'biggest opportunity', 'menu of options', 'what would be helpful']
  },

  // Test 9: Category-specific deep dive
  {
    id: 'test-9',
    name: 'Category-Specific Question - Low Score',
    activity: {
      id: 'act-9',
      name: 'Coding Bootcamp for Kids',
      role: 'Instructor',
      category: 'Education',
      timeCommitment: { hours: 6, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Taught programming to elementary students'
    },
    draft: 'I taught kids how to code. We used Scratch and they made games. It was fun and the kids learned a lot.',
    analysis: {
      nqi: 35,
      scores: [
        { name: 'emotional_maturity', score: 2, gap: 5, weight: 1.0 }
      ],
      tier: 'weak',
      authenticity: { verySpecific: false, mentionsNumbers: false, usesVagueLanguage: true }
    },
    teaching: {
      issues: []
    },
    question: 'Why is my emotional_maturity score so low?',
    expectedTone: 'Educational and specific',
    expectedElements: ['plain language explanation', 'weaker area diagnosis', 'specific moments to think about']
  },

  // Test 10: High score with small refinement
  {
    id: 'test-10',
    name: 'Almost Perfect - Minor Polish',
    activity: {
      id: 'act-10',
      name: 'Research Lab',
      role: 'Research Assistant',
      category: 'Research',
      timeCommitment: { hours: 15, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Contributed to cancer research'
    },
    draft: 'The petri dish didn\'t show the expected cell growth. Again. For three months, I\'d been running the same protocol, getting the same null results, and starting to doubt whether I belonged in research. But Dr. Chen told me that negative data is still data - it tells you where not to look. That shift in perspective transformed my understanding of science. Now, as I prepare to present our findings on unsuccessful protein markers at the regional conference, I realize that research isn\'t about being brilliant; it\'s about being persistent and intellectually honest.',
    analysis: {
      nqi: 84,
      scores: [
        { name: 'future_oriented', score: 7, gap: 0.5, weight: 1.1 }
      ],
      tier: 'excellent',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
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
      }]
    },
    question: 'What else could I add to make this perfect?',
    expectedTone: 'Validating excellence, suggesting subtle touch',
    expectedElements: ['strong narrative', 'close to target', 'subtle refinement', 'don\'t over-edit']
  },

  // Tests 11-15: Varied question types and scores
  // (continuing with more scenarios...)
];

// Add 5 more scenarios for tests 11-15
scenarios.push(
  {
    id: 'test-11',
    name: 'Mid-Range Score - Multiple Issues',
    activity: {
      id: 'act-11',
      name: 'Youth Sports Coach',
      role: 'Volunteer Coach',
      category: 'Athletics',
      timeCommitment: { hours: 8, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Coached youth soccer team'
    },
    draft: 'I coached a youth soccer team for two years. The kids ranged from ages 8-10. We practiced twice a week and had games on Saturdays. I taught them basic skills and teamwork. By the end of the season, the team had improved significantly and we won several games.',
    analysis: {
      nqi: 52,
      scores: [
        { name: 'narrative_craft', score: 4, gap: 3, weight: 1.0 },
        { name: 'transformative_impact', score: 5, gap: 2, weight: 1.4 }
      ],
      tier: 'developing',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: true }
    },
    teaching: {
      issues: [
        {
          id: 'i11a',
          title: 'Show Personal Growth',
          severity: 'high',
          fromDraft: 'I taught them basic skills and teamwork',
          principle: 'Narratives need personal transformation',
          impactOnScore: 'Could improve NQI by 8-10 points',
          problem: 'You describe what the kids learned, but what did YOU learn?',
          whyMatters: 'Colleges want to see your growth, not just your impact on others',
          suggestions: ['What surprised you about coaching?', 'How did a specific kid change your perspective?'],
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
      ]
    },
    question: 'I have multiple issues - where should I start?',
    expectedTone: 'Prioritizing and clarifying',
    expectedElements: ['one main focus', 'biggest impact', 'quick win mention', 'step-by-step approach']
  },
  {
    id: 'test-12',
    name: 'Improving Narrative - Delta Tracking',
    activity: {
      id: 'act-12',
      name: 'Student Government',
      role: 'Class Representative',
      category: 'Leadership',
      timeCommitment: { hours: 5, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Represented student body'
    },
    draft: 'As class representative, I learned that real change happens slowly. When students complained about cafeteria food, I couldn\'t just demand better meals - I had to understand budgets, build relationships with administrators, and find compromises. After 4 months of proposals and meetings, we secured funding for a salad bar. The victory was small, but the lesson was huge: advocacy requires patience and perspective.',
    analysis: {
      nqi: 73,
      scores: [],
      tier: 'strong',
      authenticity: { verySpecific: false, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
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
      }]
    },
    question: 'Am I making progress? I\'ve been working on this for weeks.',
    expectedTone: 'Encouraging about improvement trajectory',
    expectedElements: ['real progress', 'versions', 'refining thinking', 'next level'],
    context: {
      analysis: {
        delta: 8,
        initialNqi: 65
      },
      history: {
        totalVersions: 3,
        improvementTrend: 'steadily improving'
      }
    }
  },
  {
    id: 'test-13',
    name: 'Strong Narrative - Reflection Prompt Request',
    activity: {
      id: 'act-13',
      name: 'Hospital Volunteer',
      role: 'Patient Companion',
      category: 'Healthcare',
      timeCommitment: { hours: 6, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Supported patients and families'
    },
    draft: 'Volunteering in the pediatric ward, I met Emma, a 7-year-old with leukemia who wanted to paint. As we created art together between her treatments, I realized that healing isn\'t always medical - sometimes it\'s about preserving childhood joy in clinical spaces. This experience crystallized my interest in pediatric medicine and the importance of holistic care.',
    analysis: {
      nqi: 76,
      scores: [
        { name: 'intellectual_depth', score: 7, gap: 0.5, weight: 1.2 }
      ],
      tier: 'strong',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: [{
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
      }]
    },
    question: 'Can you help me with reflection questions to make this deeper?',
    expectedTone: 'Supportive guide toward deeper thinking',
    expectedElements: ['reflection prompts available', 'help dig deeper', 'develop thinking', 'walk you through']
  },
  {
    id: 'test-14',
    name: 'Vague Draft - Needs Everything',
    activity: {
      id: 'act-14',
      name: 'Music lessons',
      role: 'Piano student',
      category: 'Arts',
      timeCommitment: { hours: 10, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Studied piano'
    },
    draft: 'I take piano lessons and practice every day. Music is important to me.',
    analysis: {
      nqi: 12,
      scores: [
        { name: 'voice_integrity', score: 1, gap: 6, weight: 1.2 },
        { name: 'specificity_evidence', score: 0.5, gap: 6.5, weight: 1.3 }
      ],
      tier: 'weak',
      authenticity: { verySpecific: false, mentionsNumbers: false, usesVagueLanguage: true }
    },
    teaching: {
      issues: [{
        id: 'i14',
        title: 'Develop Complete Narrative',
        severity: 'critical',
        fromDraft: 'Music is important to me',
        principle: 'Show, don\'t tell',
        impactOnScore: 'Could improve NQI by 25+ points',
        problem: 'This is a statement, not a story',
        whyMatters: 'Admissions officers need to see specific experiences and reflection',
        suggestions: ['Describe one moment at the piano that mattered', 'What challenge did you overcome?'],
        hasReflectionPrompts: true
      }]
    },
    question: 'How do I make this better?',
    expectedTone: 'Gentle and foundational',
    expectedElements: ['early stages', 'start with meaning', 'specific moment', 'build from there']
  },
  {
    id: 'test-15',
    name: 'Near-Perfect - Seeking Validation',
    activity: {
      id: 'act-15',
      name: 'Mental Health Advocacy',
      role: 'Club President',
      category: 'Mental Health',
      timeCommitment: { hours: 8, period: 'week' },
      portfolioScores: {},
      whyItMatters: 'Reduced stigma around mental health'
    },
    draft: 'I founded our school\'s first mental health awareness club after watching my best friend struggle in silence. The hardest part wasn\'t organizing events or inviting speakers - it was admitting that I, too, had struggled with anxiety. When I shared my story at our first assembly, my voice shook, but 50 students showed up to our next meeting. This year, we\'ve normalized conversations about mental health, reduced stigma, and connected 127 students with resources. More importantly, I\'ve learned that vulnerability isn\'t weakness - it\'s the foundation of authentic leadership.',
    analysis: {
      nqi: 91,
      scores: [
        { name: 'holistic_excellence', score: 9, gap: 0, weight: 1.1 }
      ],
      tier: 'excellent',
      authenticity: { verySpecific: true, mentionsNumbers: true, usesVagueLanguage: false }
    },
    teaching: {
      issues: []
    },
    question: 'Is this good enough for top schools?',
    expectedTone: 'Affirming and reassuring',
    expectedElements: ['excellent/outstanding', 'stands out', 'authentic voice', 'trust this']
  }
);

// ============================================================================
// TEST EXECUTION
// ============================================================================

console.log('╔═══════════════════════════════════════════════════════════════╗');
console.log('║   COMPREHENSIVE CHAT RESPONSE TESTING SUITE                  ║');
console.log('║   Testing 15 varied scenarios with quality analysis          ║');
console.log('╚═══════════════════════════════════════════════════════════════╝\n');

// Import the mock response generator
// Since we can't actually import TypeScript in Node, this is pseudocode
// In practice, we'd need to compile or use ts-node

// For now, let's output the test scenarios in a readable format
scenarios.forEach((scenario, index) => {
  console.log(`\n${'═'.repeat(70)}`);
  console.log(`TEST ${index + 1}: ${scenario.name}`);
  console.log(`${'═'.repeat(70)}`);
  console.log(`\n📝 SETUP:`);
  console.log(`   Activity: ${scenario.activity.name} (${scenario.activity.role})`);
  console.log(`   NQI Score: ${scenario.analysis.nqi}/100 (${scenario.analysis.tier})`);
  console.log(`   Draft Length: ${scenario.draft.length} characters`);
  console.log(`   Issues: ${scenario.teaching.issues.length}`);

  console.log(`\n❓ STUDENT QUESTION:`);
  console.log(`   "${scenario.question}"`);

  console.log(`\n🎯 EXPECTED RESPONSE QUALITIES:`);
  console.log(`   Tone: ${scenario.expectedTone}`);
  console.log(`   Should include: ${scenario.expectedElements.join(', ')}`);

  console.log(`\n📜 DRAFT EXCERPT:`);
  console.log(`   "${scenario.draft.substring(0, 150)}${scenario.draft.length > 150 ? '...' : ''}"`);

  if (scenario.teaching.issues.length > 0) {
    console.log(`\n🔍 TOP ISSUE:`);
    console.log(`   ${scenario.teaching.issues[0].title}`);
    console.log(`   Severity: ${scenario.teaching.issues[0].severity}`);
    console.log(`   Impact: ${scenario.teaching.issues[0].impactOnScore}`);
  }

  console.log(`\n✅ READY FOR TESTING IN BROWSER`);
});

console.log(`\n\n${'═'.repeat(70)}`);
console.log('TESTING INSTRUCTIONS:');
console.log(`${'═'.repeat(70)}`);
console.log(`
1. Navigate to: http://localhost:8086/portfolio-insights?tab=evidence
2. For each test scenario above:
   a. Create or select an activity matching the test
   b. Enter the draft text
   c. Wait for analysis
   d. Ask the specified question in chat
   e. Evaluate the response against expected qualities

3. Quality Criteria to Check:
   ✓ Is the tone conversational and warm (not robotic)?
   ✓ Does it tell a story rather than listing facts?
   ✓ Is there ONE main insight followed by options?
   ✓ Does it quote the student's actual draft?
   ✓ Is technical jargon translated to plain language?
   ✓ Does it feel like talking to a mentor, not a rubric?
   ✓ Is the response structured for easy reading?
   ✓ Does it end with a question or suggested next steps?

4. Document any issues:
   - Responses that feel too mechanical
   - Missing expected elements
   - Awkward phrasing or structure
   - Too much information at once
   - Not conversational enough
`);

console.log(`\n${'═'.repeat(70)}`);
console.log('Test suite ready! Open http://localhost:8086/portfolio-insights');
console.log(`${'═'.repeat(70)}\n`);
