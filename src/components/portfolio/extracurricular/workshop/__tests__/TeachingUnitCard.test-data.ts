/**
 * Test Data for TeachingUnitCard
 *
 * Includes simple and complex test cases to validate the component
 * and iterate on the user experience.
 */

import { WorkshopIssue } from '@/services/workshop/workshopAnalyzer';
import { ExperienceEntry } from '@/core/types/experience';
import { TEACHING_EXAMPLES } from '@/services/workshop/teachingExamples';

// ============================================================================
// SIMPLE TEST CASE - Missing Metrics
// ============================================================================

export const simpleEntry: ExperienceEntry = {
  id: 'test-entry-1',
  user_id: 'test-user',
  title: 'Volunteer Food Bank',
  organization: 'Local Community Center',
  role: 'Volunteer Coordinator',
  description_original: 'I volunteered frequently at the food bank, helping organize distributions.',
  category: 'service',
  hours_per_week: 4,
  weeks_per_year: 40,
  time_span: '2 years',
  tags: ['service', 'community', 'leadership'],
  version: 1,
};

export const simpleIssue: WorkshopIssue = {
  id: 'specificity-no-numbers',
  category: 'Specificity & Evidence',
  severity: 'critical',
  title: 'Missing Concrete Numbers',
  from_draft: 'I volunteered frequently at the food bank',
  problem: 'Vague words like "frequently" leave readers guessing about your actual commitment. Without numbers, admissions can\'t gauge whether this was a casual hobby or serious dedication.',
  why_matters: 'Specific numbers build credibility and help admissions officers understand the scale of your work. "156 hours over 11 months" is far more impressive than "volunteered regularly."',
  suggested_fixes: [
    {
      fix_text: 'Replace "frequently" with: "X hours per week for Y months" or total hours.',
      why_this_works: 'Time commitment signals dedication and helps readers understand scope.',
      teaching_example: '"156 hours over 11 months" is more impressive than "volunteered regularly."',
      apply_type: 'replace',
    },
    {
      fix_text: 'Add time commitment: "Every Tuesday and Thursday, 6-8pm, for 18 months."',
      why_this_works: 'Specific days and times make it concrete and believable.',
      teaching_example: '"Every Tuesday, 6-9pm, for 18 months" shows sustained, structured commitment.',
      apply_type: 'add',
    },
    {
      fix_text: 'Quantify people impacted: "Helped organize distribution for 200+ families."',
      why_this_works: 'Scale of impact matters for assessing significance.',
      teaching_example: '"Organized food distribution for 200+ families" vs "helped distribute food."',
      apply_type: 'add',
    },
  ],
  teachingExample: TEACHING_EXAMPLES.find(ex => ex.id === 'spec-001-add-metrics') || null,
  priority: 1,
};

// ============================================================================
// COMPLEX TEST CASE - Robotics Team (Realistic Scenario)
// ============================================================================

export const complexEntry: ExperienceEntry = {
  id: 'test-entry-2',
  user_id: 'test-user',
  title: 'Robotics Team',
  organization: 'Lincoln High School',
  role: 'Lead Programmer',
  description_original: 'As lead programmer on the robotics team, I was responsible for coding the autonomous period. I worked with the team to improve our robot\'s performance and we did well at competitions. Through this experience, I learned teamwork and problem-solving skills.',
  category: 'academic',
  hours_per_week: 15,
  weeks_per_year: 38,
  time_span: '3 years',
  tags: ['robotics', 'STEM', 'leadership', 'programming'],
  version: 1,
};

export const complexIssues: WorkshopIssue[] = [
  // Issue 1: Essay-speak / Generic reflection
  {
    id: 'voice-essay-speak-1',
    category: 'Voice Integrity',
    severity: 'critical',
    title: 'Essay-Speak Detected',
    from_draft: 'Through this experience, I learned teamwork and problem-solving skills.',
    problem: 'This sounds like formal essay language instead of your authentic voice. "Through this experience" is a classic essay-speak phrase, and "learned teamwork" is too generic.',
    why_matters: 'Authentic voice makes you memorable. Generic essay-speak makes every applicant sound the same.',
    suggested_fixes: [
      {
        fix_text: 'Cut this sentence entirely and show the learning through a specific story instead.',
        why_this_works: 'Showing beats telling. Let readers discover your insight through narrative.',
        teaching_example: 'Instead of "I learned leadership," write about the specific moment your approach changed.',
        apply_type: 'replace',
      },
      {
        fix_text: 'Rewrite in conversational tone: "Turns out..." or "I didn\'t expect..."',
        why_this_works: 'Conversational openers signal authenticity and feel less manufactured.',
        teaching_example: '"Turns out, debugging code taught me more about patience than any meditation app."',
        apply_type: 'reframe',
      },
      {
        fix_text: 'Replace with a specific moment that demonstrates the insight.',
        why_this_works: 'Concrete moments are more memorable and credible than stated lessons.',
        teaching_example: '"When Sarah caught my bug three hours before the demo, I realized great teams make everyone better."',
        apply_type: 'replace',
      },
    ],
    teachingExample: TEACHING_EXAMPLES.find(ex => ex.id === 'voice-001-essay-speak') || null,
    priority: 1,
  },

  // Issue 2: Vague outcomes
  {
    id: 'specificity-vague-outcomes',
    category: 'Specificity & Evidence',
    severity: 'critical',
    title: 'Vague Outcomes',
    from_draft: 'we did well at competitions',
    problem: '"Did well" is too vague. What does "well" mean? First place? Top 10? Regional qualifier? Readers can\'t visualize your achievement.',
    why_matters: 'Specific results are more impressive and credible. "Qualified for state championship, placing 4th out of 47 teams" beats "did well."',
    suggested_fixes: [
      {
        fix_text: 'Add specific placement: "Placed 4th out of 47 teams at regionals, qualifying for state."',
        why_this_works: 'Concrete rankings give context and prove achievement.',
        teaching_example: '"Placed 3rd out of 38 teams" vs "did well at competition."',
        apply_type: 'replace',
      },
      {
        fix_text: 'Describe a specific technical achievement: "Our autonomous scored 85% accuracy, up from 40%."',
        why_this_works: 'Technical metrics show your specific contribution and improvement.',
        teaching_example: '"Vision system improved from 60% to 94% target accuracy."',
        apply_type: 'add',
      },
      {
        fix_text: 'Add before/after comparison: "First competition: 2-3 record. Final competition: 8-1 record."',
        why_this_works: 'Growth trajectory proves you actually improved, not just participated.',
        apply_type: 'add',
      },
    ],
    teachingExample: TEACHING_EXAMPLES.find(ex => ex.id === 'spec-002-quantify-impact') || null,
    priority: 2,
  },

  // Issue 3: Passive role language
  {
    id: 'initiative-passive-role',
    category: 'Initiative & Leadership',
    severity: 'important',
    title: 'Passive Role Language',
    from_draft: 'I was responsible for coding',
    problem: '"Was responsible for" is passive and bureaucratic. It sounds like you were assigned a task, not that you took initiative or ownership.',
    why_matters: 'Initiative and ownership impress admissions more than just completing assigned tasks.',
    suggested_fixes: [
      {
        fix_text: 'Replace with active ownership: "I designed and implemented the autonomous code."',
        why_this_works: 'Active verbs (designed, implemented) show agency and technical skill.',
        teaching_example: '"I architected the vision system" vs "I was responsible for the vision system."',
        apply_type: 'replace',
      },
      {
        fix_text: 'Show initiative: "When our autonomous failed at the first competition, I rebuilt it from scratch."',
        why_this_works: 'Problem-solving under pressure demonstrates leadership.',
        teaching_example: '"I debugged 47 edge cases in 72 hours before regionals" shows initiative.',
        apply_type: 'reframe',
      },
      {
        fix_text: 'Clarify unique contribution: "What would NOT have happened without you?"',
        why_this_works: 'Counterfactual thinking reveals your irreplaceable impact.',
        apply_type: 'elicit',
      },
    ],
    teachingExample: TEACHING_EXAMPLES.find(ex => ex.id === 'initiative-002-passive-to-active') || null,
    priority: 3,
  },

  // Issue 4: No stakes or challenge
  {
    id: 'narrative-no-stakes',
    category: 'Narrative Arc & Stakes',
    severity: 'important',
    title: 'Missing Stakes or Challenge',
    from_draft: 'I worked with the team to improve our robot\'s performance',
    problem: 'This sounds smooth and easy. Where was the challenge? What went wrong? What obstacles did you face? Stories without tension don\'t engage readers.',
    why_matters: 'Challenge makes achievement meaningful. Admissions officers want to see how you handle adversity, not just success.',
    suggested_fixes: [
      {
        fix_text: 'Identify one crisis: "Three days before regionals, our vision system failed completely."',
        why_this_works: 'Specific obstacles create narrative tension and show problem-solving.',
        teaching_example: '"Two hours before finals, the autonomous code crashed. No backup." — Creates stakes.',
        apply_type: 'add',
      },
      {
        fix_text: 'Show vulnerability: "I spent two weeks debugging a single line of code. I questioned whether I could solve it."',
        why_this_works: 'Vulnerability makes you relatable and shows authentic struggle.',
        teaching_example: '"My first three prototypes failed. I almost quit." — Then show how you persevered.',
        apply_type: 'add',
      },
      {
        fix_text: 'Add time pressure: "72 hours before competition, with zero working autonomous code."',
        why_this_works: 'Deadlines amplify tension and show you perform under pressure.',
        apply_type: 'add',
      },
    ],
    teachingExample: TEACHING_EXAMPLES.find(ex => ex.id === 'narrative-001-add-stakes') || null,
    priority: 4,
  },
];

// ============================================================================
// EDGE CASES
// ============================================================================

export const edgeCaseNoTeachingExample: WorkshopIssue = {
  id: 'rare-issue-no-example',
  category: 'Craft & Language Quality',
  severity: 'helpful',
  title: 'Sentence Variety Needs Improvement',
  from_draft: 'I did this. I did that. I also did another thing.',
  problem: 'Repetitive sentence structure makes your writing monotonous.',
  why_matters: 'Varied sentence structure demonstrates writing maturity and keeps readers engaged.',
  suggested_fixes: [
    {
      fix_text: 'Vary sentence length: Mix short punchy sentences with longer flowing ones.',
      why_this_works: 'Rhythm creates engagement and emphasizes key points.',
      apply_type: 'reframe',
    },
  ],
  teachingExample: null, // No example in corpus
  priority: 5,
};

export const edgeCaseLongDraft: ExperienceEntry = {
  id: 'test-entry-3',
  user_id: 'test-user',
  title: 'Very Long Description Test',
  description_original: `As the founder and president of the Climate Action Club, I spearheaded our school's first comprehensive sustainability initiative. Over three years, I built the club from 5 founding members to 120+ active participants, organized 15 campus-wide events including our annual Earth Week festival, established partnerships with 8 local environmental organizations, and led our team in implementing a campus-wide composting program that diverted 2,400 pounds of organic waste from landfills in its first year. Through countless late nights planning events, navigating administrative challenges, and learning to delegate effectively, I discovered that meaningful change requires not just passion, but strategic thinking, persistent communication, and the humility to learn from setbacks. This experience transformed my understanding of leadership from "having all the answers" to "empowering others to find answers together."`,
  category: 'leadership',
  hours_per_week: 8,
  weeks_per_year: 36,
  version: 1,
};

// ============================================================================
// TEST UTILITIES
// ============================================================================

export function createMockEntry(overrides: Partial<ExperienceEntry>): ExperienceEntry {
  return {
    id: 'mock-entry',
    user_id: 'mock-user',
    title: 'Mock Activity',
    description_original: 'Mock description for testing.',
    category: 'leadership',
    version: 1,
    ...overrides,
  };
}

export function createMockIssue(overrides: Partial<WorkshopIssue>): WorkshopIssue {
  return {
    id: 'mock-issue',
    category: 'Voice Integrity',
    severity: 'important',
    title: 'Mock Issue',
    from_draft: 'Mock excerpt from draft',
    problem: 'Mock problem description',
    why_matters: 'Mock reason why this matters',
    suggested_fixes: [
      {
        fix_text: 'Mock fix suggestion',
        why_this_works: 'Mock rationale',
        apply_type: 'replace',
      },
    ],
    teachingExample: null,
    priority: 1,
    ...overrides,
  };
}
