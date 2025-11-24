import React from 'react';
import { HoverCard, HoverCardTrigger, HoverCardContent } from '@/components/ui/hover-card';
import { LucideIcon, Rocket, Target, Heart, Sparkles, AlertTriangle } from 'lucide-react';
import { KPI } from '@/components/portfolio/impact/KPIDashboard';
import { ImpactFrame } from '@/components/portfolio/impact/ImpactFramePicker';
import { Artifact } from '@/components/portfolio/impact/ProofStrip';
import { Initiative } from '@/components/portfolio/impact/ImpactLedger';
import { SnapshotMetric } from '@/components/portfolio/impact/ImpactSnapshot';
import { QualityDimension } from '@/components/portfolio/impact/ImpactQualityCheck';
import { GuidanceInsight } from '@/components/portfolio/impact/StorytellingGuidance';
import { RecognitionOverviewData } from '@/components/portfolio/recognition/RecognitionOverview';
import { RecognitionItem } from '@/components/portfolio/recognition/RecognitionCard';
import { ExtracurricularOverviewData } from '@/components/portfolio/extracurricular/ExtracurricularOverview';
import { ExtracurricularItem } from '@/components/portfolio/extracurricular/ExtracurricularCard';

// Types
export interface KeyTakeaway {
  label: string;
  description: string;
  icon: LucideIcon;
  colorClass: string;
}

export type EvidenceProps = { text: string; details: string[] };
export type RichSegment = string | EvidenceProps;

export interface VerdictOption {
  id: string;
  text: RichSegment[];
  score: number;
  reasoning: string;
}

export interface StoryTellingOption {
  id: string;
  positioning: string;
  narrative: RichSegment[];
  score: number;
  reasoning: string;
  tags?: string[]; // Added for dynamic traits
}

export interface ImpactData {
  primaryMetric: {
    value: number;
    label: string;
    unit: string;
  };
  secondaryMetrics: Array<{
    value: number | string;
    label: string;
  }>;
  description: string;
  proofLinks: Array<{
    label: string;
    url: string;
    type: 'internal' | 'external';
  }>;
  timeline: Array<{
    date: string;
    initiative: string;
    metric: string;
    status: 'ongoing' | 'completed' | 'planned';
  }>;
}

export interface RecognitionData {
  summary: string;
  tiers: Array<{
    tier: 'national' | 'state' | 'regional' | 'school';
    count: number;
    awards: Array<{
      name: string;
      date: string;
      issuer: string;
      link?: string;
    }>;
  }>;
  tierDefinitions: Array<{
    tier: string;
    description: string;
    percentile: string;
    colorClass: string;
  }>;
}

export interface OverarchingInsight {
  verdictOptions: {
    spine: VerdictOption[];
    spike: VerdictOption[];
    lift: VerdictOption[];
    blind_spots?: VerdictOption[];
  };
  storyTellingOptions: StoryTellingOption[];
  readinessInContext: RichSegment[];
  storyCoherencePercent: number;
  storyCoherenceLine: RichSegment[];
  impactFootprint: RichSegment[];
  recognitionMix: RichSegment[];
  trajectoryDurability: RichSegment[];
  contextContribution: RichSegment[];
  committeeSoundBite: RichSegment[];
  impactData: ImpactData;
  recognitionData: RecognitionData;
  // Recognition Tab Data
  recognitionOverview?: RecognitionOverviewData;
  recognitionItems?: RecognitionItem[];
  // Extracurricular Tab Data
  extracurricularOverview?: ExtracurricularOverviewData;
  extracurricularItems?: ExtracurricularItem[];
  // Impact Tab - Redesigned for reflection and insights
  snapshotSummary?: string;
  snapshotMetrics?: SnapshotMetric[];
  kpis?: KPI[];
  impactFrames?: ImpactFrame[];
  artifacts?: Artifact[];
  initiatives?: Initiative[];
  impactQuality?: {
    dimensions: QualityDimension[];
    overallAssessment: string;
  };
  storytellingGuidance?: GuidanceInsight[];
}

// Achievement interface for gamification
export interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
}

// School comparison interface
export interface SchoolComparison {
  tier: string;
  avgScore: number;
  difference: number;
}

export interface HolisticSummary {
  overallScore: number;
  tierName: string;
  tierPercentile: string;
  profileSummary: string;
  achievements?: Achievement[];
  schoolComparisons?: SchoolComparison[];
  coreIdentity: KeyTakeaway;
  competitivePosition: KeyTakeaway;
  narrativeTheme: KeyTakeaway;
  biggestDifferentiator: KeyTakeaway;
  criticalGap: KeyTakeaway;
  overarchingInsight?: OverarchingInsight;
}

// Helper Components
const InlineEvidence: React.FC<EvidenceProps> = ({ text, details }) => (
  <HoverCard>
    <HoverCardTrigger asChild>
      <span className="underline decoration-dotted underline-offset-4 cursor-help text-sky-600 hover:text-sky-700">
        {text}
      </span>
    </HoverCardTrigger>
    <HoverCardContent align="start" className="w-80">
      <div className="text-sm font-semibold mb-1">Evidence</div>
      <ul className="list-disc pl-5 space-y-1 text-sm leading-6">
        {details.map((d, i) => (
          <li key={i} className="text-foreground/90">{d}</li>
        ))}
      </ul>
    </HoverCardContent>
  </HoverCard>
);

export const renderRich = (segments: RichSegment[]) =>
  segments.map((seg, i) =>
    typeof seg === 'string' ? <span key={i}>{seg}</span> : <InlineEvidence key={i} text={seg.text} details={seg.details} />
  );

// IMPORTANT: Hard-coded mock data representing a holistic portfolio analysis
// In production, this would be generated by AI analyzing the user's complete portfolio
// and synthesizing patterns across all dimensions, activities, and achievements
export const MOCK_HOLISTIC_SUMMARY: HolisticSummary = {
  overallScore: 8.2,
  tierName: 'Diamond Achiever',
  tierPercentile: 'Top 15%',
  profileSummary: 'You present as a community-focused STEM leader with demonstrated technical expertise, sustained volunteer commitment, and emerging research capabilities. Your portfolio shows cross-domain versatility, positioning you competitively for Top 20 schools with reach potential for Top 10.',
  achievements: [
    { id: 'stem_excellence', name: 'STEM Excellence', description: 'Outstanding performance in STEM courses', unlocked: true },
    { id: 'leadership_award', name: 'Leadership Impact', description: 'Founded and led successful student organization', unlocked: true },
    { id: 'community_champion', name: 'Community Champion', description: 'Completed 200+ service hours', unlocked: true },
    { id: 'national_recognition', name: 'National Recognition', description: 'Earned national-level awards', unlocked: true },
    { id: 'perfect_attendance', name: 'Perfect Attendance', description: 'Never missed a deadline', unlocked: false },
    { id: 'research_pioneer', name: 'Research Pioneer', description: 'Published research paper', unlocked: false },
    { id: 'test_master', name: 'Test Master', description: 'Scored in 99th percentile', unlocked: false },
    { id: 'multi_talented', name: 'Multi-Talented', description: 'Excelled in diverse fields', unlocked: true },
  ],
  schoolComparisons: [
    { tier: 'Elite Schools (Top 10)', avgScore: 8.9, difference: -0.7 },
    { tier: 'Target Schools (Top 25)', avgScore: 8.0, difference: 0.2 },
    { tier: 'Safety Schools (Top 50)', avgScore: 7.0, difference: 1.2 },
  ],
  coreIdentity: {
    label: 'STEM Leader & Community Catalyst',
    description: 'You consistently combine technical projects with community service, showing you can lead in both contexts.',
    icon: Rocket,
    colorClass: 'border-primary',
  },
  competitivePosition: {
    label: 'Strong T20, Reach for T10',
    description: 'Your profile aligns well with schools ranked 11-20. Stanford/MIT are reaches; schools like Duke/Northwestern are targets.',
    icon: Target,
    colorClass: 'border-purple-500',
  },
  narrativeTheme: {
    label: 'Using Technology to Democratize Access',
    description: 'Your story centers on leveraging technical skills to create opportunities for underserved communities.',
    icon: Heart,
    colorClass: 'border-green-500',
  },
  biggestDifferentiator: {
    label: 'Cross-Domain Leadership (Tech + Community)',
    description: 'Unlike most STEM students focused purely on research, you balance technical depth with genuine community impact.',
    icon: Sparkles,
    colorClass: 'border-orange-500',
  },
  criticalGap: {
    label: 'Need Quantifiable Impact Metrics',
    description: 'Your community activities lack specific numbers (people served, hours, outcomes), making impact hard to assess.',
    icon: AlertTriangle,
    colorClass: 'border-destructive',
  },
  overarchingInsight: {
    verdictOptions: {
      spine: [
        {
          id: 'civic-tech-democratizer',
          text: [
            'Your spine is clear: using technology to democratize access - from ',
            { text: 'Title I workshops', details: ['Free cycles for two Title I partners', 'Avg 24 students/session'] },
            ' to mentoring first-time coders via the ',
            { text: 'library program', details: ['Monthly beginner cohorts since Jan 2024', 'Consistent waitlist demand'] },
            '.'
          ],
          score: 9.2,
          reasoning: 'Strongest narrative thread - unifies technical skills, community impact, and leadership across all activities'
        },
        {
          id: 'education-equity-champion',
          text: [
            'You are an education equity champion who leverages ',
            { text: 'technical expertise', details: ['Full-stack platform, 118 weekly users', 'Adaptive controller kits for inclusion'] },
            ' to expand opportunity for underserved students, with a track record of ',
            { text: 'sustained mentorship', details: ['18 months tutoring program', '24 mentees across two cohorts'] },
            ' that demonstrates genuine investment beyond building.'
          ],
          score: 8.7,
          reasoning: 'Emphasizes social justice angle - highly valued but slightly narrower than democratization theme'
        },
        {
          id: 'systems-builder',
          text: [
            'You are a systems thinker who identifies inefficiencies and builds ',
            { text: 'scalable solutions', details: ['Platform architecture serves 2 schools', 'Open-source controller repo: 42 stars'] },
            ' that outlive your direct involvement, as evidenced by ',
            { text: 'handoff documentation', details: ['Onboarding checklist, weekly runbook', 'Successor training materials'] },
            ' ensuring continuity.'
          ],
          score: 8.3,
          reasoning: 'Highlights analytical and architectural abilities, but less emotionally resonant than access narrative'
        },
        {
          id: 'cross-disciplinary-connector',
          text: [
            'You bridge policy, data science, and community organizing - translating ',
            { text: 'budget PDFs into dashboards', details: ['Civic Tech Challenge finalist', 'Public changelog, partner quotes'] },
            ' while simultaneously running ',
            { text: 'hands-on programs', details: ['Weekly tutoring sessions', 'Monthly beginner workshops'] },
            ' that connect technical work to human outcomes.'
          ],
          score: 7.9,
          reasoning: 'Unique positioning but may seem unfocused without careful framing - requires precise essay execution'
        }
      ],
      spike: [
        {
          id: 'quantifiable-impact',
          text: [
            'Your ',
            { text: 'quantifiable community impact', details: ['118 students weekly through tutoring platform', 'MOUs with two partner schools', 'Tutor roster grew 6 to 19', 'Retention improving 12 pts'] },
            ' is exceptional - concrete adoption metrics and institutional partnerships that separate you from peers who claim "impact" without evidence.'
          ],
          score: 9.5,
          reasoning: 'Most distinctive spike - hard numbers validate claims and demonstrate scale rarely seen in high school portfolios'
        },
        {
          id: 'technical-leadership',
          text: [
            'A distinctive spike in engineering-for-access with real adoption - your ',
            { text: 'tutoring platform', details: ['118 weekly active students last month', 'MOUs with two partner schools', 'Tutor roster grew 6 to 19'] },
            ' consistently serves local schools, and the ',
            { text: 'adaptive controller kits', details: ['18 robotics members using kits', 'Open-source repo: 42 stars, 9 forks'] },
            ' lowered barriers for new participants.'
          ],
          score: 8.8,
          reasoning: 'Demonstrates technical maturity and sustained operation - shows you can shepherd projects from idea to adoption'
        },
        {
          id: 'external-validation',
          text: [
            'Your spike is in externally validated impact: ',
            { text: 'national finalist recognition', details: ['Civic Tech Challenge - finalist (top 10/1,200)'] },
            ' for civic technology combined with ',
            { text: 'state-level awards', details: ['State CS Olympiad - 2nd place', 'State Service Innovation Award - winner'] },
            ' that validate both technical craft and community contribution.'
          ],
          score: 8.4,
          reasoning: 'Third-party validation carries weight, but slightly weaker than direct adoption metrics'
        }
      ],
      lift: [
        {
          id: 'recognition-pursuit',
          text: [
            'Biggest lift: convert effort into public outcomes. Instead of logging hours, surface a compact metrics layer - a single ',
            { text: 'impact hub', details: ['One page consolidating beneficiaries, before/after, artifacts, testimonials'] },
            ' that quantifies who benefited and how across programs.'
          ],
          score: 9.0,
          reasoning: 'Most critical gap - you have strong work that lacks third-party validation. National competitions would dramatically strengthen credibility'
        },
        {
          id: 'leadership-breadth',
          text: [
            'You should ',
            { text: 'expand leadership beyond tech', details: ['Consider student government role', 'Arts/culture leadership opportunity', 'Cross-domain club presidency'] },
            ' to demonstrate versatility. Your technical leadership is clear, but schools want to see you can lead in contexts where you\'re not the expert.'
          ],
          score: 7.5,
          reasoning: 'Would strengthen well-roundedness, but lower priority than recognition - your tech leadership is already strong'
        }
      ],
      blind_spots: [
        {
          id: 'narrow-focus',
          text: [
            'Unintended Signal: Your profile might signal a ',
            { text: 'lack of intellectual curiosity', details: ['No humanities/arts electives', 'Essays focus purely on utility/building'] },
            ' outside of engineering. Admissions officers at liberal arts colleges want to see how you engage with ideas, not just tools.'
          ],
          score: 8.5,
          reasoning: 'Common pitfall for strong STEM applicants - risk of seeming one-dimensional.'
        },
        {
          id: 'savior-complex',
          text: [
            'Risk: Your narrative on "democratizing access" could read as a ',
            { text: 'savior complex', details: ['Language emphasizes "giving" to "underprivileged"'] },
            ' if not careful. Frame it as partnership and learning from the community, not just bestowing technology upon them.'
          ],
          score: 7.8,
          reasoning: 'Nuance in tone is critical for service narratives to avoid clichés.'
        }
      ]
    },
    storyTellingOptions: [
      {
        id: 'civic-tech-narrative',
        positioning: 'Civic-Tech Builder',
        narrative: [
          'Frame your application around: building technology for civic good. Lead with the ',
          { text: 'tutoring platform', details: ['118 weekly active students', 'Two schools', 'Retention improving'] },
          ' as living proof of impact at scale. In your personal statement, focus on the moment you realized code could ',
          { text: 'democratize access', details: ['Title I workshops expanding reach', 'Library program removing barriers'] },
          ' to education. Position supplements around how each project serves underserved communities. This narrative aligns perfectly with top-tier college values (innovation + equity).'
        ],
        score: 9.1,
        reasoning: 'Best aligns with top-tier college values - innovation paired with social impact. Most compelling for T10 schools'
      },
      {
        id: 'equity-advocate-narrative',
        positioning: 'Education Equity Advocate',
        narrative: [
          'Position yourself as someone who uses tech to expand opportunity. Center your ',
          { text: 'sustained mentorship', details: ['18 months tutoring program', '24 mentees across cohorts', 'Documented skill progression'] },
          ' and frame the platform as a tool that emerged from seeing tutors struggle with coordination. Personal statement should explore your ',
          { text: 'identity connection', details: ['First-gen college aspirant', 'Resource constraints shaped perspective'] },
          ' to access issues. This narrative is powerful but requires authentic personal connection to avoid seeming performative.'
        ],
        score: 8.6,
        reasoning: 'Strong social justice angle - highly valued but competitive. Requires authentic personal connection to resonate'
      },
      {
        id: 'systems-thinker-narrative',
        positioning: 'Technical Systems Architect',
        narrative: [
          'Tell the story of someone who sees inefficient systems and builds ',
          { text: 'scalable solutions', details: ['Platform architecture', 'Open-source contributions', 'Handoff documentation'] },
          '. Your narrative centers on sustainability - projects that ',
          { text: 'outlive your involvement', details: ['Documented handoffs', 'Successor training', 'Maintained operations'] },
          '. This positions you as mature and systems-oriented, ideal for engineering programs that value architectural thinking.'
        ],
        score: 8.2,
        reasoning: 'Appeals to technical programs but less emotionally compelling - best for pure CS/engineering applications'
      },
      {
        id: 'policy-to-action-narrative',
        positioning: 'Policy-to-Action Translator',
        narrative: [
          'Frame yourself as bridging the gap between policy and implementation. Start with ',
          { text: 'civic tech work', details: ['Budget visualization dashboard', 'Policy data made accessible'] },
          ' and show how this connects to hands-on programs. Position your technical skills as a means to ',
          { text: 'translate complex systems', details: ['Data visualization for accessibility', 'Platform reducing coordination friction'] },
          ' into actionable tools. This narrative works well for schools with strong public policy + CS intersections (Stanford, Harvard, Princeton).'
        ],
        score: 7.8,
        reasoning: 'Unique angle but requires careful execution - risk of seeming scattered across too many domains'
      }
    ],
    readinessInContext: [
      'Readiness is strong relative to availability: you maximized rigor and show an upward trend. With ',
      { text: 'limited AP availability', details: ['School profile lists 6 AP vs district 12'] },
      ' you still hit the ceiling; the transcript climbs from 10th grade, and dual-enrolling in ',
      { text: 'Multivariable', details: ['College Multivariable completed with A-', 'Linear Algebra in progress'] },
      ' validates preparation for upper-division work.'
    ],
    storyCoherencePercent: 78,
    storyCoherenceLine: [
      'Coherence sits at 78%: 7 of 9 activities and your main essays reinforce the access theme. The personal statement focuses on ',
      { text: 'assistive tech for access', details: ['Draft PS references accessibility outcomes and user testing notes'] },
      ', which is echoed by recommenders who highlight your teaching-and-buildership pattern.'
    ],
    impactFootprint: [
      'Impact concentrates in education access. The ',
      { text: 'tutoring platform', details: ['118 weekly active students; two partner schools; retention improving 12 pts'] },
      ' reduces friction for students and coordinators, while ',
      { text: 'workshop series', details: ['Three cycles delivered; avg 24 students/session; pre/post quiz gains 18%'] },
      ' expands reach beyond your school.'
    ],
    recognitionMix: [
      'Credibility is supported by external reads: ',
      { text: 'national finalist', details: ['Civic Tech Challenge - finalist (top 10/1,200)'] },
      ', ',
      { text: 'two state-level awards', details: ['State CS Olympiad - 2nd place', 'State Service Innovation Award - winner'] },
      ', and multiple school honors. This ladder validates both craft and contribution.'
    ],
    trajectoryDurability: [
      'Trajectory points up and the work outlives you. You progressed from tutor to program ',
      { text: 'director', details: ['Tutor to coordinator to director; scope expanded to two schools'] },
      ', built written playbooks, and trained successors for two orgs. Durability is visible in maintained schedules and ',
      { text: 'handoff docs', details: ['Shared drive: onboarding checklist, weekly runbook, escalation contacts'] },
      ' that keep services running.'
    ],
    contextContribution: [
      'Context reframes choices: despite ',
      { text: 'limited AP availability', details: ['School offers 6 AP vs district 12'] },
      ', you expanded rigor via college math and contributed to an ',
      { text: 'open-source repo', details: ['Regular issues/PRs across 6 months; 42 stars; 9 forks'] },
      ', signaling initiative and community orientation.'
    ],
    committeeSoundBite: [
      '"Admit as the ',
      { text: 'civic-tech builder', details: ['Budget PDF to dashboard prototype; partner quotes; public changelog'] },
      ' who turns messy policy data into tools people actually use."'
    ],
    // HARD-CODED DATA: Comprehensive impact and recognition data for results board
    kpis: [
      {
        id: 'reach',
        value: 118,
        label: 'Weekly Active Students',
        context: 'Across 2 Title I schools over 18 months of sustained programming',
        trend: { direction: 'up' as const, change: '+94 from Sept 2023 baseline (24 students)' },
        significance: 'Direct service delivery, not one-time event. Demonstrates sustained engagement and operational capacity to manage multi-site programs.'
      },
      {
        id: 'retention',
        value: '+12pts',
        label: 'Retention Improvement',
        context: 'Spring 2024 vs. Fall 2023 cohort completion rates',
        trend: { direction: 'up' as const, change: 'From 64% completion to 76% completion' },
        significance: 'Indicates quality and stickiness, not just signup. Behavioral change signal—students found sustained value beyond initial curiosity.'
      },
      {
        id: 'depth',
        value: '24 avg',
        label: 'Students Per Workshop',
        context: '3 cycles delivered, 9 sessions total across Spring 2024',
        significance: 'Consistent engagement across multiple delivery formats. Shows ability to attract and retain audience beyond platform.'
      },
      {
        id: 'durability',
        value: '2/2',
        label: 'Programs Still Running',
        context: 'After leadership handoff and transition planning',
        significance: 'Built to last beyond founder involvement. Evidence of institutional buy-in and sustainable design, not just personal charisma.'
      }
    ],
    // Impact Tab - Redesigned focused data
    snapshotSummary: 'Your work created sustained access to academic support for 118 students weekly across two Title I schools, with measurable improvements in retention and documented institutional adoption.',
    snapshotMetrics: [
      { value: 118, label: 'Students Weekly', icon: 'users' as const },
      { value: '76%', label: 'Retention Rate', icon: 'target' as const },
      { value: '+12pts', label: 'Improvement', icon: 'trending' as const }
    ],
    impactFrames: [
      {
        id: 'scale' as const,
        label: 'Scale & Reach',
        description: 'Emphasize breadth of impact and number of beneficiaries',
        narrative: [
          'Your work reaches ',
          { text: '118 students weekly', evidence: 'Platform analytics: avg 118 weekly active users Jan-May 2024, verified by partner coordinators' },
          ' across ',
          { text: '2 Title I schools', evidence: 'Partnership MOUs with Lincoln HS (83% free/reduced lunch) and Jefferson MS (76% free/reduced lunch)' },
          ', delivering ',
          { text: 'sustained programming', evidence: '18 consecutive months of operation (Sept 2023 - Present), no service gaps' },
          ' rather than one-off events. The workshop series expanded reach to ',
          { text: '72 additional students', evidence: '3 cycles × 24 avg attendance = 72 cumulative students, verified by sign-in sheets' },
          ' beyond the platform, demonstrating multi-channel delivery capability and audience diversity.'
        ],
        supportingMetrics: [
          { metric: 'Total Beneficiaries', value: 190, context: '118 platform + 72 workshops' },
          { metric: 'Service Hours', value: '2,400+', context: '118 students × 2 hrs/week × 18 months' },
          { metric: 'Geographic Spread', value: '2 districts', context: 'Metro and Riverside districts' }
        ],
        strengthScore: 9.2
      },
      {
        id: 'depth' as const,
        label: 'Depth & Quality',
        description: 'Emphasize transformation and meaningful change for individuals',
        narrative: [
          'Impact shows in behavioral change, not just participation. ',
          { text: 'Retention improved 12 percentage points', evidence: 'Fall 2023: 64% completion → Spring 2024: 76% completion, tracked via platform analytics' },
          ', indicating students found sustained value beyond initial curiosity. Pre/post workshop assessments showed ',
          { text: '18% knowledge gains', evidence: 'Avg pre-quiz: 62%, post-quiz: 80% (n=72 students across 3 cycles)' },
          '. Qualitative feedback reveals ',
          { text: 'confidence shifts', evidence: 'Partner coordinator: "Students now volunteer to present their work publicly, which they wouldn\'t before"' },
          ' beyond test scores—students gained agency in academic contexts, requesting advanced topics and peer teaching opportunities.'
        ],
        supportingMetrics: [
          { metric: 'Retention Rate', value: '76%', context: '+12pts from 64% baseline' },
          { metric: 'Learning Gains', value: '+18%', context: 'Pre/post quiz delta (62%→80%)' },
          { metric: 'Testimonials', value: 4, context: 'Unprompted student + partner quotes' }
        ],
        strengthScore: 8.7
      },
      {
        id: 'catalyst' as const,
        label: 'Catalyst & Systems Change',
        description: 'Emphasize how your work enabled others or changed institutional practices',
        narrative: [
          "Your platform didn't just serve students—it ",
          { text: 'reduced coordinator burden', evidence: 'Partner feedback: "Cuts admin time from 4hrs to 30min/week for session scheduling and tracking"' },
          ' and ',
          { text: 'enabled peer tutors', evidence: '19 student tutors recruited and trained across two schools, up from 6 initial tutors' },
          ' to lead. The district adopted your ',
          { text: 'scheduling framework', evidence: 'MOU references "scheduling protocol developed by [student]" as model for other programs' },
          ' for other student-led programs. By building ',
          { text: 'replicable infrastructure', evidence: 'Handoff docs successfully used by successor program at 3rd school (Riverside HS)' },
          ', you multiplied impact beyond direct service—creating conditions for others to lead without requiring your presence.'
        ],
        supportingMetrics: [
          { metric: 'Staff Time Saved', value: '3.5 hrs/week', context: 'Per coordinator × 2 sites = 7 hrs/week total' },
          { metric: 'Peer Leaders Activated', value: 19, context: 'Student tutors recruited and trained' },
          { metric: 'Institutional Adoption', value: 1, context: 'District protocol based on your model' }
        ],
        strengthScore: 8.4
      },
      {
        id: 'policy' as const,
        label: 'Policy & Data Translation',
        description: 'Emphasize how you made complex information actionable',
        narrative: [
          'You translated ',
          { text: 'opaque budget PDFs', evidence: 'Screenshot: 200-page district budget PDF with no search or comparison features' },
          ' into an ',
          { text: 'interactive dashboard', evidence: 'GitHub repo: civic-budget-viz with filters, search, year-over-year comparison' },
          ' that community members actually used for ',
          { text: 'public comment', evidence: 'School board meeting video (April 2024): 3 residents reference dashboard data in public comment' },
          '. This bridged the gap between policy data and civic participation, demonstrating ',
          { text: 'information design skills', evidence: 'Dashboard features: budget line item search, year-over-year visualization, department filtering' },
          ' that lower barriers to civic engagement and enable informed participation in local governance.'
        ],
        supportingMetrics: [
          { metric: 'Dashboard Users', value: 340, context: 'Unique visitors in first 3 months' },
          { metric: 'Public Comments', value: 3, context: 'School board attendees citing dashboard' },
          { metric: 'Data Points', value: '2,400+', context: 'Budget line items × 3 years visualized' }
        ],
        strengthScore: 7.9
      },
      {
        id: 'research' as const,
        label: 'Research & Documentation',
        description: 'Emphasize systematic inquiry and knowledge contribution',
        narrative: [
          'You approached tutoring not as service alone but as ',
          { text: 'design research', evidence: 'User interviews: 12 students, 3 coordinators conducted with documented notes' },
          '. Pre/post assessments, ',
          { text: 'structured feedback loops', evidence: 'Bi-weekly student surveys via Google Forms, coordinator debriefs with meeting notes' },
          ', and documented ',
          { text: 'iteration logs', evidence: 'GitHub changelog: 47 issues closed with rationale documented for each change' },
          ' create a knowledge base others can build on. Your ',
          { text: 'handoff documentation', evidence: 'Shared drive: onboarding checklist, weekly runbook, FAQ, escalation contacts' },
          ' transforms tacit knowledge into institutional memory, enabling successors to maintain quality without direct mentorship.'
        ],
        supportingMetrics: [
          { metric: 'User Research', value: 15, context: '12 students + 3 coordinators interviewed' },
          { metric: 'Documentation', value: 8, context: 'Handoff materials (pages)' },
          { metric: 'Iterations', value: 47, context: 'Documented improvement cycles' }
        ],
        strengthScore: 7.6
      }
    ],
    artifacts: [
      {
        id: 'analytics',
        type: 'screenshot' as const,
        thumbnail: '/artifacts/platform-analytics.png',
        title: 'Platform Analytics Dashboard',
        description: '118 weekly active users, 76% retention rate (Spring 2024)',
        link: '/evidence/tutoring',
        date: 'May 2024'
      },
      {
        id: 'workshop-report',
        type: 'document' as const,
        title: 'Workshop Impact Report',
        description: 'Pre/post assessments showing 18% knowledge gains (n=72)',
        link: '/evidence/workshops.pdf',
        date: 'April 2024'
      },
      {
        id: 'partner-quote',
        type: 'quote' as const,
        title: 'Partner Coordinator Testimonial',
        description: '"Reduced my admin time from 4 hours to 30 minutes weekly"',
        date: 'March 2024'
      },
      {
        id: 'finalist-badge',
        type: 'screenshot' as const,
        thumbnail: '/artifacts/civic-tech-finalist.png',
        title: 'Civic Tech Challenge Finalist',
        description: 'Top 10 of 1,200 national applicants',
        link: 'https://example.com/civic-tech-finalist',
        date: 'March 2024'
      },
      {
        id: 'handoff-docs',
        type: 'document' as const,
        title: 'Program Handoff Documentation',
        description: 'Onboarding checklist, weekly runbook, escalation contacts',
        link: '/evidence/handoff',
        date: 'May 2024'
      },
      {
        id: 'news-feature',
        type: 'video' as const,
        thumbnail: '/artifacts/news-thumbnail.png',
        title: 'City Chronicle News Feature',
        description: '"Student Builds Bridge to Community Through Tech"',
        link: 'https://news.example.com/student-bridge-video',
        date: 'May 2024'
      },
      {
        id: 'mou-document',
        type: 'document' as const,
        title: 'School District Partnership MOU',
        description: 'Official partnership agreement with Metro School District',
        link: '/evidence/district-mou.pdf',
        date: 'January 2024'
      },
      {
        id: 'student-testimonials',
        type: 'quote' as const,
        title: 'Student Feedback Collection',
        description: '"I actually understand algebra now" and 3 other quotes',
        link: '/evidence/student-quotes',
        date: 'April 2024'
      }
    ],
    initiatives: [
      {
        id: 'tutoring-platform',
        name: 'Peer Tutoring Platform',
        beneficiary: {
          who: '118 high school students (weekly active)',
          demographics: '83% free/reduced lunch eligible, 62% first-generation college-bound, majority students of color (74% at Lincoln, 68% at Jefferson)'
        },
        timeSpan: {
          start: 'September 2023',
          duration: '18 months (ongoing)'
        },
        outcome: {
          primary: '76% retention rate (+12pts from 64% baseline)',
          secondary: [
            '19 peer tutors recruited and trained (up from 6 initial)',
            'Reduced coordinator admin time by 3.5 hrs/week per site',
            'Platform framework adopted by district for other programs'
          ],
          evidence: [
            '/evidence/platform-analytics',
            '/evidence/coordinator-testimonial',
            '/evidence/district-mou.pdf'
          ]
        },
        resources: {
          funding: 'District mini-grant ($500), no ongoing funding required',
          partners: ['Lincoln HS', 'Jefferson MS', 'State Education Dept'],
          volunteers: 19
        },
        durability: {
          status: 'ongoing' as const,
          successor: 'Junior coordinator trained with documented handoff. Platform continues serving 100+ students weekly after transition.'
        },
        impactScore: {
          overall: 8.7,
          assessment: 'This initiative demonstrates exceptional scale and sustained operation with measurable outcomes. Strong evidence base, clear beneficiary focus, and institutional adoption set it apart from typical student-run programs.',
          dimensions: [
            {
              id: 'scale',
              name: 'Scale & Reach',
              score: 9.2,
              status: 'strong' as const,
              assessment: 'Your platform serves 118 students weekly—this is exceptional scale for a student-run initiative. Most peer programs serve 10-30 students. The 18-month sustained operation demonstrates this is not a one-time event but a reliable system.',
              evidence: '118 weekly active students, 2 schools, 18 months ongoing'
            },
            {
              id: 'depth',
              name: 'Depth of Impact',
              score: 8.7,
              status: 'strong' as const,
              assessment: 'The 12-point retention improvement shows students found sustained value. This goes beyond attendance—you are measuring actual engagement and persistence, which is a higher bar than most programs track.',
              evidence: '76% retention (+12pts), student testimonials about confidence gains'
            },
            {
              id: 'evidence',
              name: 'Evidence & Credibility',
              score: 9.0,
              status: 'strong' as const,
              assessment: 'You have multiple evidence types: quantitative analytics, partner testimonials, and institutional adoption (MOU). This triangulated approach is rare and highly credible.',
              evidence: 'Platform analytics, coordinator testimonial, district MOU'
            },
            {
              id: 'sustainability',
              name: 'Sustainability & Durability',
              score: 9.5,
              status: 'strong' as const,
              assessment: 'Strong handoff with documented processes ensures continuity. The fact that the program continues serving 100+ students after your transition proves true sustainability—not just a claim.',
              evidence: 'Documented handoff, trained successor, ongoing 100+ students'
            },
            {
              id: 'systems',
              name: 'Systems Change & Multiplier Effect',
              score: 8.4,
              status: 'strong' as const,
              assessment: 'The district adopting your scheduling framework for other programs is the gold standard—you did not just run a program, you changed how the institution operates. This multiplier effect extends your impact beyond direct service.',
              evidence: 'District adopted scheduling protocol, framework replicated at 3rd school'
            },
            {
              id: 'efficiency',
              name: 'Resource Efficiency',
              score: 8.8,
              status: 'strong' as const,
              assessment: 'Minimal funding ($500 grant) yet sustained 118 students is exceptionally efficient. Recruiting 19 peer tutors shows you leveraged volunteer capacity rather than trying to do everything yourself.',
              evidence: '$500 budget, 19 volunteer tutors, 118 beneficiaries'
            },
            {
              id: 'beneficiary',
              name: 'Beneficiary Clarity & Demographics',
              score: 9.3,
              status: 'strong' as const,
              assessment: 'Exceptional demographic detail—you specify 83% free/reduced lunch, 62% first-gen, 74% students of color. This level of specificity shows you understand your beneficiaries and demonstrates equity focus.',
              evidence: '83% free/reduced lunch, 62% first-gen, 74% students of color'
            }
          ]
        },
        reframing: {
          whatYouActuallyBuilt: [
            {
              title: 'A TECHNOLOGY PLATFORM',
              icon: '🏗️',
              description: 'Created a scheduling and matching system that solved a coordination problem affecting 118 students. This is infrastructure, not just service delivery.'
            },
            {
              title: 'A SUSTAINABLE SYSTEM',
              icon: '🔄',
              description: 'Designed an operation that continued after your leadership transition—you built institutional capacity, not just a project dependent on you.'
            },
            {
              title: 'A MULTIPLIER FRAMEWORK',
              icon: '📈',
              description: 'Your scheduling protocol was adopted district-wide, extending your impact beyond direct service. You changed HOW the institution operates.'
            },
            {
              title: 'AN EQUITY INTERVENTION',
              icon: '💎',
              description: 'Targeted 83% free/reduced lunch students—this was not random service, it was intentional work addressing systemic barriers to STEM access.'
            }
          ]
        },
        leadershipSkills: [
          {
            skill: 'SYSTEMS DESIGN',
            description: 'You did not just work harder—you identified the structural problem (scheduling chaos) and built a system to solve it at scale. This is the difference between service and systems change.'
          },
          {
            skill: 'RESOURCE LEVERAGE',
            description: 'With minimal budget ($500), you recruited 19 peer tutors and served 118 students. This shows you understand force multiplication—impact does not require massive resources, it requires smart strategy.'
          },
          {
            skill: 'INSTITUTIONAL PARTNERSHIP',
            description: 'Securing an MOU and getting district adoption shows you know how to navigate bureaucracy and build legitimacy. Many students run programs; few get institutional buy-in.'
          },
          {
            skill: 'SUCCESSION PLANNING',
            description: 'You documented processes and trained a successor before graduating. Most student leaders do not think this way—you prioritized sustainability over personal credit.'
          }
        ],
        lessonsLearned: [
          {
            lesson: 'PROBLEM IDENTIFICATION > EFFORT',
            description: 'You learned that solving the right problem (coordination) matters more than working harder at the wrong problem (adding more tutors).'
          },
          {
            lesson: 'DATA DRIVES CREDIBILITY',
            description: 'Tracking retention rates and workshop attendance transformed your program from general claims to concrete evidence of 12 point improvement. Evidence turns anecdotes into arguments.'
          },
          {
            lesson: 'SUSTAINABILITY REQUIRES HUMILITY',
            description: 'Planning your own succession shows maturity—you cared more about the program future than your own indispensability. True leaders build systems that outlast them.'
          },
          {
            lesson: 'EQUITY REQUIRES INTENTIONALITY',
            description: 'You specifically targeted Title I schools with 83% free/reduced lunch rather than serving students randomly. Impact work without demographic focus often misses those who need it most.'
          }
        ],
        impressiveAngles: [
          {
            lens: '📐 THROUGH A POLICY LENS',
            description: 'Your district adopted your scheduling framework. This means your student project influenced institutional policy—you changed the rules rather than asking for permission.'
          },
          {
            lens: '💻 THROUGH A TECHNOLOGY LENS',
            description: 'You built a platform that solved a coordination problem at scale. This is product thinking—identifying user pain points (scheduling chaos) and building tech solutions.'
          },
          {
            lens: '🌍 THROUGH A SOCIAL ENTREPRENEURSHIP LENS',
            description: 'Minimal funding, volunteer leverage, measurable outcomes, institutional adoption—you essentially ran a social enterprise with $500.'
          },
          {
            lens: '📊 THROUGH A RESEARCH LENS',
            description: 'You ran what amounts to a pilot study: tested an intervention (tutoring + scheduling), measured outcomes (retention), and demonstrated replicability (adopted at 3rd school).'
          }
        ],
        retrospective: {
          whatToKeep: [
            'Focus on systems (scheduling) not just effort',
            'Evidence collection from day one',
            'Partnership with school administration',
            'Peer tutor recruitment model'
          ],
          whatToAdd: [
            'Pre/post academic assessments (grades, test scores) to complement retention data',
            'Student voice surveys to capture confidence/attitude shifts, not just behavioral outcomes',
            'Longer-term follow-up (6-12 months) to see if gains persisted'
          ],
          whatToDoDifferently: [
            'Start documentation earlier—you built great processes but waited until handoff to write them down',
            'Seek external validation (awards, media) while program was running, not after',
            'Connect with similar initiatives earlier to learn from their mistakes'
          ]
        },
        growthOpportunities: [
          {
            id: 'longitudinal-study',
            category: 'evidence' as const,
            title: 'Conduct Longitudinal Follow-Up Study',
            rationale: 'Right now you have immediate outcomes (retention, learning gains). Following students for 6-12 months would show lasting impact—did the confidence and skills persist? This elevates your evidence from activity to transformation.',
            steps: [
              'Email students who participated 6+ months ago',
              'Send 5-question survey (academic outcomes, continued STEM engagement, confidence)',
              'Aim for 30+ responses (50% response rate)',
              'Visualize in simple before/after chart',
              'Include 2-3 quotes in your application'
            ],
            effort: 'medium' as const,
            impact: 'high' as const
          },
          {
            id: 'expand-schools',
            category: 'scale' as const,
            title: 'Expand to Additional Schools',
            rationale: 'You have proven the model works at 2 schools. Expanding to 3-5 schools would demonstrate true scalability and increase your beneficiary count significantly.',
            steps: [
              'Create one-page replication guide from your handoff docs',
              'Reach out to counselors at 3 nearby Title I schools',
              'Offer to train their coordinators (2-hour session)',
              'Track adoption and monthly check-ins',
              'Report "X schools using framework" in applications'
            ],
            effort: 'high' as const,
            impact: 'high' as const
          },
          {
            id: 'national-awards',
            category: 'recognition' as const,
            title: 'Apply for National Service Awards',
            rationale: 'Your work has the metrics and evidence to compete nationally. External validation from organizations like Prudential Spirit of Community or Congressional Award would significantly boost credibility.',
            steps: [
              'Review Prudential Spirit of Community Awards criteria',
              'Draft 500-word application highlighting 118 students, retention data',
              'Request 2 letters of recommendation (coordinator + principal)',
              'Submit by November deadline',
              'If recognized, prominently feature in college apps'
            ],
            effort: 'medium' as const,
            impact: 'high' as const
          },
          {
            id: 'case-study',
            category: 'evidence' as const,
            title: 'Create Multimedia Impact Case Study',
            rationale: 'A polished 2-minute video or interactive website documenting your journey would be a powerful supplement to traditional applications and make your work more memorable.',
            steps: [
              'Film 30-second interviews with 3 students and 1 coordinator',
              'Screen record platform analytics dashboard',
              'Create simple timeline visualization (Canva or Figma)',
              'Edit into 2-minute narrative with music',
              'Host on personal website or YouTube, link in applications'
            ],
            effort: 'high' as const,
            impact: 'medium' as const
          }
        ]
      },
      {
        id: 'workshop-series',
        name: 'CS Fundamentals Workshop Series',
        beneficiary: {
          who: '72 students cumulative across 3 cycles',
          demographics: 'Students from schools without CS in curriculum, 68% underrepresented in tech'
        },
        timeSpan: {
          start: 'January 2024',
          end: 'April 2024',
          duration: '4 months'
        },
        outcome: {
          primary: '18% average learning gains on pre/post assessments',
          secondary: [
            '24 avg students per session (9 sessions total)',
            '4 unprompted student testimonials collected',
            'CS teacher adopted curriculum materials for elective course'
          ],
          evidence: [
            '/evidence/workshop-report.pdf',
            '/evidence/student-quotes',
            '/evidence/curriculum-adoption'
          ]
        },
        resources: {
          partners: ['School CS Department', 'City Public Library'],
          volunteers: 3
        },
        durability: {
          status: 'completed' as const,
          successor: 'CS teacher integrated materials into CS1 elective course starting Fall 2024'
        }
      },
      {
        id: 'civic-budget-viz',
        name: 'Civic Budget Dashboard',
        beneficiary: {
          who: '340 community members (unique users)',
          demographics: 'School board meeting attendees and local civic engagement group members'
        },
        timeSpan: {
          start: 'October 2023',
          end: 'February 2024',
          duration: '5 months'
        },
        outcome: {
          primary: 'Dashboard cited in 3 public comments at April school board meeting',
          secondary: [
            '2,400+ budget line items visualized across 3 years',
            'District adopted transparency framework based on project',
            'Open source repo maintained by local civic group (12 contributors)'
          ],
          evidence: [
            'https://github.com/username/civic-budget-viz',
            '/evidence/board-meeting-video',
            '/evidence/district-transparency-initiative'
          ]
        },
        resources: {
          partners: ['Civic Tech Challenge', 'Local Advocacy Organization']
        },
        durability: {
          status: 'handed-off' as const,
          successor: 'Open source repo maintained by local civic group. Neighboring district adapted code for their transparency initiative.'
        }
      }
    ],
    impactQuality: {
      overallAssessment: 'Your impact demonstrates strong scale and documented outcomes, with opportunities to strengthen counterfactual analysis and beneficiary voice.',
      dimensions: [
        {
          id: 'scale',
          name: 'Scale & Reach',
          score: 9,
          explanation: '118 weekly students across 2 schools shows sustained delivery capability beyond one-off events. Multi-site operation demonstrates scalability.',
          status: 'strong' as const,
          drivers: [
            '118 weekly active students sustained for 4+ months',
            'Multi-site delivery: 2 Title I schools with separate coordinators',
            'Tutor roster scaled from 6 → 19 while maintaining operations'
          ],
          improvements: [
            'Report unique yearly reach and cumulative beneficiaries',
            'Add simple map or chart visualizing geographic spread over time'
          ]
        },
        {
          id: 'depth',
          name: 'Depth & Quality',
          score: 8,
          explanation: '76% retention (+12pts) and 18% learning gains indicate meaningful transformation, not just participation. Behavioral change signals quality.',
          status: 'strong' as const,
          suggestion: 'Add 2-3 specific student stories showing transformation beyond metrics to make quality more vivid.',
          drivers: [
            'Retention improvement: 64% → 76% semester-over-semester',
            'Pre/post assessments show +18% learning gains',
            'Qualitative shift in student confidence and participation'
          ],
          improvements: [
            'Include 1-paragraph case study with baseline → outcome',
            'Show distribution of gains (median, IQR) if data available'
          ]
        },
        {
          id: 'duration',
          name: 'Duration & Sustainability',
          score: 9,
          explanation: '18 months of continuous operation with successful handoff. Platform still serving 100+ students after transition shows durability.',
          status: 'strong' as const,
          drivers: [
            '18 months uninterrupted operation documented',
            'Handoff docs enabled successor to continue service',
            'Post-handoff usage remains 100+ students weekly'
          ],
          improvements: [
            'Attach uptime or "weeks delivered" chart to evidence locker',
            'Add a short successor quote confirming continuity'
          ]
        },
        {
          id: 'beneficiary',
          name: 'Beneficiary Clarity',
          score: 7,
          explanation: 'Clear demographics (83% FRL, 62% first-gen), but light on individual beneficiary perspectives beyond coordinator quotes.',
          status: 'good' as const,
          suggestion: 'Include 1-2 direct student testimonials describing their experience and how it changed their academic trajectory.',
          drivers: [
            'Demographic clarity: FRL and first-gen stats reported',
            'Partner coordinator quotes present',
            'Some student feedback collected but not surfaced prominently'
          ],
          improvements: [
            'Capture 2 student voice snippets (1–2 sentences each)',
            'Link testimonials directly near metrics for human context'
          ]
        },
        {
          id: 'counterfactual',
          name: 'Counterfactual',
          score: 6,
          explanation: 'Some baseline data (64% vs 76% retention), but could strengthen "what would have happened without your work" narrative.',
          status: 'good' as const,
          suggestion: 'Add coordinator quote describing the previous system\'s limitations or student outcomes before your platform launched.',
          drivers: [
            'Baseline retention comparison provided',
            'Operational friction prior to platform anecdotally referenced'
          ],
          improvements: [
            'Add one-sentence “before state” with concrete numbers (e.g., no-show rate)',
            'Include time-saved estimate for coordinators prior vs after'
          ]
        },
        {
          id: 'attribution',
          name: 'Attribution & Role Clarity',
          score: 9,
          explanation: 'Clear role definition: sole developer, program director, partnership lead. GitHub commits verify code authorship. Coordinator roles clearly differentiated.',
          status: 'strong' as const,
          drivers: [
            'GitHub commit history evidences authorship',
            'Role boundaries vs coordinators documented',
            'Partnership MOUs list responsibilities'
          ],
          improvements: [
            'Add quick “my role vs partners” bullet list in activity',
            'Link to 1–2 PRs showing key architectural decisions'
          ]
        }
      ]
    },
    storytellingGuidance: [
      {
        id: 'lead-with-retention',
        type: 'strength' as const,
        headline: 'Your retention data is exceptionally strong—lead with quality over quantity',
        detail: '76% retention (+12pts improvement) demonstrates sustained value beyond initial curiosity. This is a quality signal that distinguishes your work from one-time participation metrics.',
        actionable: 'In applications, emphasize "76% of students completed full semester programs, up from 64% baseline" before mentioning raw participant counts. Quality > quantity for selective schools.'
      },
      {
        id: 'national-recognition',
        type: 'strategy' as const,
        headline: 'You have national recognition—use it to establish credibility upfront',
        detail: 'Civic Tech Challenge top 10 of 1,200 nationwide provides third-party validation of both technical execution and impact. This is a powerful credibility anchor.',
        actionable: 'Open your activity description with "National Civic Tech Challenge Finalist (Top 10/1,200)" to immediately signal competitive validation. Use this to establish authority before describing scope.'
      },
      {
        id: 'add-counterfactual',
        type: 'opportunity' as const,
        headline: 'Consider adding a counterfactual: what would have happened without your work?',
        detail: 'Your impact is clear, but you could strengthen it by explicitly describing the before state—what happened to students and coordinators before your platform existed?',
        actionable: 'Add one sentence in your activity description: "Before the platform, coordinators managed scheduling via spreadsheets with 40% tutor no-show rates and no attendance tracking." This contrast makes your contribution clearer.'
      },
      {
        id: 'beneficiary-voice',
        type: 'consideration' as const,
        headline: 'Add direct beneficiary testimonials to humanize your impact',
        detail: 'You have strong coordinator quotes, but student voice would make the transformation more vivid and emotionally resonant for readers.',
        actionable: 'Include 1-2 brief student quotes in your evidence packet: "I actually understand algebra now. Before tutoring I was completely lost." This adds human dimension to your metrics.'
      }
    ],
    impactData: {
      primaryMetric: {
        value: 118,
        label: 'Students Reached Weekly',
        unit: 'students'
      },
      secondaryMetrics: [
        { value: 2, label: 'Partner Schools' },
        { value: '+12pts', label: 'Retention Improvement' },
        { value: '18mo', label: 'Program Duration' }
      ],
      description: 'Your tutoring platform directly serves students across two Title I schools, with measurable improvements in participant retention and engagement.',
      proofLinks: [
        { label: 'Platform Analytics Dashboard', url: '/evidence/tutoring', type: 'internal' },
        { label: 'Workshop Impact Report (PDF)', url: '/evidence/workshops', type: 'internal' },
        { label: 'Civic Tech Challenge Finalist Page', url: 'https://example.com/finalist', type: 'external' }
      ],
      timeline: [
        { date: 'Sept 2023', initiative: 'Tutoring Platform Launch', metric: '6 tutors, 24 students', status: 'completed' },
        { date: 'Jan 2024', initiative: 'Second School Partnership', metric: '19 tutors, 118 students', status: 'ongoing' },
        { date: 'Apr 2024', initiative: 'Workshop Series (3 cycles)', metric: '24 avg students/session', status: 'completed' },
        { date: 'May 2024', initiative: 'Handoff Documentation', metric: 'Successor training complete', status: 'completed' },
        { date: 'Fall 2024', initiative: 'Platform V2 (Planned)', metric: 'Mobile app expansion', status: 'planned' }
      ]
    },
    recognitionData: {
      summary: '1 National Finalist • 2 State Awards • 3 School Honors',
      tiers: [
        {
          tier: 'national' as const,
          count: 1,
          awards: [
            { name: 'Civic Tech Challenge Finalist', date: 'March 2024', issuer: 'National Civic Tech Foundation', link: 'https://example.com' }
          ]
        },
        {
          tier: 'state' as const,
          count: 2,
          awards: [
            { name: 'State CS Olympiad - 2nd Place', date: 'Feb 2024', issuer: 'State Education Dept' },
            { name: 'State Service Innovation Award', date: 'April 2024', issuer: 'Governor\'s Office' }
          ]
        },
        {
          tier: 'school' as const,
          count: 3,
          awards: [
            { name: 'Outstanding Community Service', date: 'May 2024', issuer: 'High School' },
            { name: 'CS Department Award', date: 'May 2024', issuer: 'High School' },
            { name: 'Humanitarian Leadership', date: 'May 2023', issuer: 'High School' }
          ]
        }
      ],
      tierDefinitions: [
        { tier: 'National', description: 'Recognized among 10,000+ applicants nationwide', percentile: 'Top 1%', colorClass: 'from-amber-500 to-yellow-400' },
        { tier: 'State', description: 'Distinguished among state-level competitors', percentile: 'Top 5%', colorClass: 'from-blue-500 to-cyan-400' },
        { tier: 'Regional', description: 'Notable recognition within regional network', percentile: 'Top 15%', colorClass: 'from-orange-500 to-amber-400' },
        { tier: 'School', description: 'Honored by institution for exceptional contribution', percentile: 'Top 25%', colorClass: 'from-green-500 to-emerald-400' }
      ]
    },
    // Recognition Tab - Comprehensive prioritization data
    recognitionOverview: {
      portfolioLiftScore: 8.4,
      assessmentLabel: 'Strong Validation',
      oneLineSummary: 'Your recognition portfolio demonstrates exceptional competitive validation with national-level distinction and consistent state honors. Strong recency and clear alignment to your STEM + community impact narrative.',
      mixAnalysis: {
        nationalCount: 1,
        stateCount: 2,
        regionalCount: 0,
        schoolCount: 3,
        mostRecentDate: 'May 2024',
        spineAlignmentPercent: 83,
        recencyScore: 'excellent' as const
      },
      difficulty: {
        overallScore: 9.1,
        highestLabel: 'Top 10 of 1,200',
        context: 'Civic Tech Challenge Finalist',
        percentile: 99
      },
      competitivePositioning: {
        selectivityBenchmark: {
          theirAverage: 2.4,
          ivyAdmitsAverage: 3.1,
          top20Average: 5.2,
          top50Average: 8.7,
          percentile: 78,
          interpretation: 'Your portfolio selectivity places you in the 78th percentile of Ivy+ admitted students. This means your recognition portfolio is more competitive than 78% of students who were accepted to Ivy League schools.'
        },
        tierDistribution: {
          current: { national: 17, state: 33, school: 50 },
          ivyTypical: { national: 35, state: 40, school: 25 },
          top20Typical: { national: 25, state: 45, school: 30 },
          analysis: 'Your portfolio is weighted toward school-level recognitions compared to typical Ivy+ admits. Adding 1-2 more national or state honors would bring you closer to the competitive benchmark.',
          impactProjection: {
            withOneMoreNational: { percentile: 85 },
            withOneMoreState: { percentile: 81 }
          }
        },
        competitiveDensity: {
          stemCount: 4,
          communityCount: 3,
          leadershipCount: 2,
          artsCount: 0,
          diversificationScore: 7.2,
          analysis: 'Your recognitions cluster around STEM and community impact, creating a clear and consistent narrative signal. This is ideal for STEM-focused applications. No diversification needed - maintain focus.'
        }
      },
      qualityIndicators: {
        issuerPrestige: [
          {
            recognition: 'Civic Tech Challenge Finalist',
            issuerType: 'foundation' as const,
            prestigeScore: 9.2,
            contextTooltip: 'National foundation with rigorous selection process. Top 10 of 1,200 applicants nationwide demonstrates exceptional validation.'
          },
          {
            recognition: 'State CS Olympiad - 2nd Place',
            issuerType: 'state_agency' as const,
            prestigeScore: 8.0,
            contextTooltip: 'State Education Department administered competition with documented selection criteria and public rankings.'
          },
          {
            recognition: 'State Service Innovation Award',
            issuerType: 'governor' as const,
            prestigeScore: 7.8,
            contextTooltip: 'Governor\'s Office recognition for innovative community service. Statewide selection with limited awards.'
          },
          {
            recognition: 'School Awards (3)',
            issuerType: 'institution' as const,
            prestigeScore: 5.5,
            contextTooltip: 'Institutional awards demonstrate local recognition but have limited competitive differentiation at selective colleges.'
          }
        ],
        averageIssuerPrestige: 7.6,
        recencyDistribution: {
          last6Months: 4,
          months6to12: 2,
          months12to24: 0,
          older: 0,
          recencyScore: 9.3,
          analysis: 'Your recognition portfolio demonstrates current and ongoing achievement. 100% of your recognitions are from the past year, signaling sustained excellence.'
        },
        verification: {
          verifiedCount: 3,
          selfReportedCount: 3,
          verificationRate: 50,
          recommendation: 'Consider gathering verification for self-reported recognitions to strengthen credibility. Even informal documentation (emails, photos, certificates) adds legitimacy during application verification.'
        }
      },
      gapAnalysisGrowth: {
        criticalGaps: [
          {
            issue: 'Only 1 national-level recognition',
            impact: 'Adding 1 more national honor would move you from 78th → 85th percentile of Ivy+ admits',
            priority: 'HIGH' as const
          },
          {
            issue: '50% of portfolio is school-level',
            impact: 'School recognitions don\'t differentiate at selective colleges. Focus future efforts on state/national competitions.',
            priority: 'MEDIUM' as const
          }
        ],
        minorGaps: [
          'No arts/humanities recognition (acceptable for STEM applicants - not a concern given your focus)',
          'All recognitions from current year (excellent recency but lacks multi-year trajectory evidence)'
        ],
        diminishingReturns: [
          {
            category: 'School-level recognitions',
            currentCount: 3,
            recommendation: 'Adding more school awards won\'t increase competitive standing. Your time is better spent on state/national competitions.'
          },
          {
            category: 'Community service validation',
            currentCount: 2,
            recommendation: 'You have sufficient recognitions validating community impact. Further recognitions in this area would be redundant.'
          }
        ],
        growthTrajectory: {
          timelineData: [
            { quarter: 'Q1 2023', count: 1 },
            { quarter: 'Q2 2023', count: 0 },
            { quarter: 'Q3 2023', count: 0 },
            { quarter: 'Q4 2023', count: 1 },
            { quarter: 'Q1 2024', count: 2 },
            { quarter: 'Q2 2024', count: 2 }
          ],
          trend: 'accelerating' as const,
          analysis: 'Your recognition earning has accelerated in 2024, earning 4 honors in first half vs 2 in all of 2023. This upward trajectory signals increasing achievement.'
        },
        seniorYearStrategy: {
          timeRemaining: '8 months until Regular Decision',
          realisticTargets: [
            '1-2 more recognitions achievable before apps',
            'Focus on competitions with Fall 2024 deadlines',
            'Prioritize national/state over additional school'
          ],
          strategicTiming: [
            'September-October: Apply to competitions',
            'November-December: Results announced, update apps',
            'January: Update colleges with new honors'
          ],
          actionsTabCTA: 'See specific competition recommendations, deadlines, and application strategies in the Actions tab.'
        }
      },
      strategicUsage: {
        credibilityReferences: [
          {
            recognition: 'Civic Tech Challenge Finalist',
            whenToReference: 'When discussing your community impact projects. Establishes that outside experts validated your work quality and mission alignment.',
            exampleFraming: '...which earned recognition as a National Civic Tech Challenge Finalist, validating both the platform\'s technical execution and community need.'
          },
          {
            recognition: 'State CS Olympiad - 2nd Place',
            whenToReference: 'When discussing technical skills. Proves competitive coding ability without needing to explain your skill level.',
            exampleFraming: 'My programming skills, validated through 2nd place at the State CS Olympiad, enabled me to...'
          }
        ],
        expandOnInAdditionalInfo: [
          {
            recognition: 'Civic Tech Challenge Finalist',
            whatToInclude: [
              'Selectivity statistics (top 10 of 1,200)',
              'Evaluation criteria judges used',
              'What this recognition validates (technical + impact, not just one or the other)'
            ]
          },
          {
            recognition: 'Service Innovation Award',
            whatToInclude: [
              'State-level selection process',
              'Why the Governor\'s Office recognized your work',
              'What differentiated your submission from other applicants'
            ]
          }
        ],
        positioning: {
          flagship: ['Civic Tech Challenge Finalist → Common App #1'],
          bridge: [
            'State CS Olympiad → Honors section',
            'Service Innovation Award → Common App #3'
          ],
          support: ['3 school-level → Group in Activities #8-10']
        }
      }
    },
    recognitionItems: [
      // Hard coded recognition data with comprehensive scoring
      {
        id: 'civic-tech-finalist',
        name: 'Civic Tech Challenge Finalist',
        issuer: 'National Civic Tech Foundation',
        date: 'March 2024',
        tier: 'national' as const,
        type: 'award' as const,
        link: 'https://example.com/civic-tech',
        selectivity: {
          accepted: 10,
          applicants: 1200,
          acceptanceRate: 0.008,
          description: 'Top 10 of 1,200 nationwide'
        },
        scores: {
          impressiveness: {
            overall: 9.2,
            breakdown: {
              selectivity: 9.8,
              issuerPrestige: 8.5,
              fieldScale: 9.0,
              recency: 9.5
            }
          },
          narrativeFit: {
            overall: 9.8,
            analysis: 'This recognition directly validates your technology + community impact narrative. The "civic tech" frame perfectly bridges your STEM skills and social impact work. Competitive distinction (top 10/1,200) proves both technical execution and mission alignment.',
            spineAlignment: 95,
            themeSupport: ['STEM Skills', 'Community Impact', 'Technology for Good']
          },
          portfolioLift: {
            overall: 9.6,
            reasoning: 'National-level competitive validation that establishes credibility and distinguishes from regional peers.',
            strategicValue: [
              'Establishes national-level credibility',
              'Third-party validation of impact quality',
              'Distinguishes you from regional peers',
              'Competitive filter proves merit at scale'
            ]
          }
        },
        recommendedUse: 'flagship' as const,
        usageGuidance: {
          whereToUse: [
            'Common App Activity #1 (lead credential)',
            'Honors section (first entry)',
            'Supplemental essays (credibility anchor)'
          ],
          howToFrame: [
            'Lead with selectivity numbers upfront: "Top 10 of 1,200 nationwide"',
            'Use to establish authority before describing details',
            'Emphasize competitive validation of both tech and impact'
          ],
          framingAngles: [
            { angle: 'Competitive Distinction', example: 'Nationally recognized among 1,200 civic tech projects' },
            { angle: 'Technical Validation', example: 'Platform design and execution validated by national judges' },
            { angle: 'Impact Credibility', example: 'Community impact verified through competitive evaluation' }
          ]
        }
      },
      {
        id: 'state-service-innovation',
        name: 'State Service Innovation Award',
        issuer: "Governor's Office",
        date: 'April 2024',
        tier: 'state' as const,
        type: 'institutional' as const,
        selectivity: {
          accepted: 25,
          applicants: 450,
          acceptanceRate: 0.056,
          description: 'Top 25 of 450 state applicants'
        },
        scores: {
          impressiveness: {
            overall: 8.5,
            breakdown: {
              selectivity: 8.8,
              issuerPrestige: 9.0,
              fieldScale: 8.0,
              recency: 8.5
            }
          },
          narrativeFit: {
            overall: 8.8,
            analysis: 'Validates the "service innovation" angle of your work. The Governor\'s Office recognition adds institutional weight and shows your work resonates beyond tech circles into policy and civic leadership spaces.',
            spineAlignment: 85,
            themeSupport: ['Community Impact', 'Innovation', 'Leadership']
          },
          portfolioLift: {
            overall: 8.7,
            reasoning: 'High-prestige institutional validation that bridges technical and civic leadership.',
            strategicValue: [
              'Institutional credibility from state government',
              'Validates community impact at policy level',
              'Bridges tech skills with civic leadership'
            ]
          }
        },
        recommendedUse: 'flagship' as const,
        usageGuidance: {
          whereToUse: [
            'Common App Activity #2 or Honors section',
            'Essays discussing community impact',
            'Leadership supplements'
          ],
          howToFrame: [
            'Emphasize institutional validation: "Recognized by Governor\'s Office"',
            'Use to validate community-facing work',
            'Pair with civic tech finalist for composite narrative'
          ],
          framingAngles: [
            { angle: 'Policy Recognition', example: 'Service innovation model recognized at state policy level' },
            { angle: 'Institutional Trust', example: 'Governor\'s Office validated community impact approach' }
          ]
        }
      },
      {
        id: 'state-cs-olympiad',
        name: 'State CS Olympiad - 2nd Place',
        issuer: 'State Education Department',
        date: 'February 2024',
        tier: 'state' as const,
        type: 'award' as const,
        selectivity: {
          accepted: 3,
          applicants: 180,
          acceptanceRate: 0.017,
          description: 'Top 3 of 180 state competitors'
        },
        scores: {
          impressiveness: {
            overall: 8.0,
            breakdown: {
              selectivity: 9.0,
              issuerPrestige: 7.5,
              fieldScale: 7.5,
              recency: 8.0
            }
          },
          narrativeFit: {
            overall: 7.5,
            analysis: 'Validates technical skills but is less central to your civic impact spine. It supports your technical credibility without directly connecting to the community service theme.',
            spineAlignment: 70,
            themeSupport: ['STEM Skills', 'Technical Competence']
          },
          portfolioLift: {
            overall: 7.8,
            reasoning: 'Strong technical credential that supports but does not lead your narrative.',
            strategicValue: [
              'Validates technical/CS competence',
              'Competitive distinction in academic domain',
              'Supports but doesn\'t define primary narrative'
            ]
          }
        },
        recommendedUse: 'bridge' as const,
        usageGuidance: {
          whereToUse: [
            'Honors section (after flagship awards)',
            'CS/STEM supplements as supporting evidence',
            'Activity descriptions to show technical foundation'
          ],
          howToFrame: [
            'Use as supporting credential, not lead',
            'Frame as technical foundation for civic work',
            'Mention briefly to establish CS credibility'
          ],
          framingAngles: [
            { angle: 'Technical Foundation', example: 'CS skills validated through state competition placement' },
            { angle: 'Academic Rigor', example: 'Top 3 finish demonstrates technical depth' }
          ]
        }
      },
      {
        id: 'community-service-award',
        name: 'Outstanding Community Service Award',
        issuer: 'High School',
        date: 'May 2024',
        tier: 'school' as const,
        type: 'institutional' as const,
        scores: {
          impressiveness: {
            overall: 5.8,
            breakdown: {
              selectivity: 4.0,
              issuerPrestige: 6.5,
              fieldScale: 5.0,
              recency: 8.0
            }
          },
          narrativeFit: {
            overall: 7.2,
            analysis: 'This award validates your community impact theme but lacks the competitive distinction of your higher-tier recognitions. It is evidence of local appreciation but does not differentiate at the selective college level.',
            spineAlignment: 75,
            themeSupport: ['Community Impact', 'Service']
          },
          portfolioLift: {
            overall: 6.3,
            reasoning: 'Local validation that supports narrative but adds minimal competitive distinction.',
            strategicValue: [
              'Local validation of service commitment',
              'Shows sustained institutional recognition',
              'Supports but does not lead your narrative'
            ]
          }
        },
        recommendedUse: 'support' as const,
        usageGuidance: {
          whereToUse: [
            'Honors section (after higher-tier awards)',
            'As supporting evidence, not lead credential',
            'Group with other school recognitions'
          ],
          howToFrame: [
            'Don\'t lead with this—bury after competitive awards',
            'Cluster with other school honors as group',
            'Use primarily if it rounds out a theme'
          ],
          framingAngles: [
            { angle: 'Local Impact', example: 'School community recognized sustained service commitment' }
          ],
          strategicNote: 'This recognition is valuable for demonstrating consistency but should not be emphasized over your national/state distinctions. List it, but don\'t feature it prominently.'
        }
      },
      {
        id: 'cs-department-award',
        name: 'CS Department Award',
        issuer: 'High School',
        date: 'May 2024',
        tier: 'school' as const,
        type: 'institutional' as const,
        scores: {
          impressiveness: {
            overall: 5.5,
            breakdown: {
              selectivity: 3.5,
              issuerPrestige: 6.0,
              fieldScale: 5.0,
              recency: 8.0
            }
          },
          narrativeFit: {
            overall: 6.8,
            analysis: 'Validates CS skills at school level but redundant with state CS Olympiad placement. Adds minimal new information beyond existing technical credentials.',
            spineAlignment: 60,
            themeSupport: ['STEM Skills']
          },
          portfolioLift: {
            overall: 6.0,
            reasoning: 'Redundant with higher-tier CS recognition; minimal strategic value.',
            strategicValue: [
              'Local CS recognition',
              'Supports technical credibility at school level'
            ]
          }
        },
        recommendedUse: 'support' as const,
        usageGuidance: {
          whereToUse: [
            'Honors section (grouped with school awards)',
            'Only if space allows after competitive recognitions'
          ],
          howToFrame: [
            'Group with other school honors',
            'De-emphasize given redundancy with state CS award'
          ],
          framingAngles: [
            { angle: 'Local Technical Recognition', example: 'Department-level CS excellence' }
          ],
          strategicNote: 'Consider omitting if space is limited, as state CS Olympiad placement is a stronger signal of the same skill.'
        }
      },
      {
        id: 'humanitarian-leadership',
        name: 'Humanitarian Leadership Award',
        issuer: 'High School',
        date: 'May 2023',
        tier: 'school' as const,
        type: 'institutional' as const,
        scores: {
          impressiveness: {
            overall: 5.2,
            breakdown: {
              selectivity: 3.5,
              issuerPrestige: 6.0,
              fieldScale: 5.0,
              recency: 6.5
            }
          },
          narrativeFit: {
            overall: 7.5,
            analysis: 'Thematically aligned with community impact narrative but dated (one year old) and school-level only. Shows early commitment but less impressive than recent state/national recognitions.',
            spineAlignment: 80,
            themeSupport: ['Community Impact', 'Leadership', 'Service']
          },
          portfolioLift: {
            overall: 6.2,
            reasoning: 'Shows early trajectory of impact work but less valuable than recent higher-tier awards.',
            strategicValue: [
              'Demonstrates sustained commitment (longitudinal)',
              'Early recognition of leadership potential',
              'Supports narrative of consistent service orientation'
            ]
          }
        },
        recommendedUse: 'support' as const,
        usageGuidance: {
          whereToUse: [
            'Honors section (last entries)',
            'Use to show longitudinal commitment if needed',
            'Group with other early recognitions'
          ],
          howToFrame: [
            'Frame as early indicator of sustained trajectory',
            'De-emphasize date to avoid highlighting age',
            'Use only if it helps show progression story'
          ],
          framingAngles: [
            { angle: 'Early Trajectory', example: 'Leadership recognized early, sustained over time' }
          ],
          strategicNote: 'The one-year age reduces value. Only include if you need to demonstrate longitudinal commitment or if you have limited honors to list.'
        }
      }
    ],
    // Extracurricular Tab - Comprehensive activity analysis
    extracurricularOverview: {
      portfolioWeightScore: 8.7,
      assessmentLabel: 'Exceptionally Deep & Balanced',
      oneLineSummary: 'Your extracurricular portfolio demonstrates sustained commitment (avg 2.8 years), clear leadership progression, and strong alignment with your civic tech narrative spine (88% match).',
      balanceAnalysis: {
        totalActivities: 7,
        categoryBreakdown: {
          leadership: 3,
          service: 2,
          research: 1,
          academic: 1
        },
        averageCommitmentYears: 2.8,
        totalCommitmentHours: 1840,
        balanceScore: 'exceptional' as const,
        spineAlignmentPercent: 88
      },
      commitmentDepth: {
        longevityBenchmark: {
          theirAverage: 2.8,
          topApplicantsAverage: 3.2,
          percentile: 72,
          interpretation: 'Your commitment spans are strong - 2.8 years per activity places you in the 72nd percentile of top applicants. Most activities show multi-year involvement, demonstrating sustained dedication rather than resume-building.'
        },
        leadershipProgression: {
          activitiesWithGrowth: 4,
          activitiesStagnant: 3,
          analysis: 'You show consistent upward movement in 4 of 7 activities, with clear role progression from member to leadership positions. This trajectory signals increasing responsibility and trust from organizations.'
        },
        hoursBenchmark: {
          totalHours: 1840,
          vsTopApplicants: 'Above average',
          weeklyAverage: 15
        }
      },
      impactEvolution: {
        tangibilityDistribution: {
          highlyMeasurable: 4,
          moderate: 2,
          vague: 1,
          tangibilityScore: 8.2,
          analysis: 'Your activities have strong concrete outcomes - 57% include specific metrics. This tangibility makes impact claims credible and verifiable.'
        },
        skillDevelopment: {
          technicalSkills: ['Full-stack development', 'Data visualization', 'Product management'],
          leadershipSkills: ['Team building', 'Strategic planning', 'Budget management'],
          interpersonalSkills: ['Mentorship', 'Public speaking', 'Stakeholder management'],
          growthTrajectory: 'Accelerating'
        }
      },
      balanceGapsAnalysis: {
        criticalGaps: [
          {
            issue: 'No arts or humanities extracurriculars',
            impact: 'Portfolio is heavily STEM-focused, which is fine for technical programs but may limit appeal for liberal arts colleges',
            priority: 'LOW' as const
          }
        ],
        overweightedCategories: [
          {
            category: 'Leadership',
            count: 3,
            recommendation: 'Your leadership activities are strong and well-differentiated. No need to add more - you risk diluting impact.'
          }
        ],
        depthVsBreadthRatio: {
          currentRatio: '4 deep (3+ years), 3 breadth (1-2 years)',
          idealRatio: '3-4 deep, 2-3 breadth',
          adjustment: 'Your ratio is ideal - you have depth in core activities while showing breadth of interests.'
        }
      },
      applicationStrategy: {
        centerpiece: ['Student Government President', 'Community Tutoring Platform'],
        supporting: ['Robotics Club Vice President', 'Civic Tech Research'],
        descriptionPriority: [
          {
            activity: 'Student Government President',
            priority: 1,
            reasonToHighlight: 'Strongest leadership role with quantifiable impact and role progression'
          },
          {
            activity: 'Community Tutoring Platform',
            priority: 2,
            reasonToHighlight: 'Demonstrates technical + community impact alignment with spine'
          }
        ],
        essayOpportunities: [
          {
            activity: 'Student Government President',
            promptTypes: ['Leadership challenge', 'Community contribution', 'Overcoming obstacles'],
            uniqueAngle: 'Implementing digital democracy tools to increase student engagement'
          },
          {
            activity: 'Community Tutoring Platform',
            promptTypes: ['Problem you solved', 'Impact on community', 'Innovation'],
            uniqueAngle: 'Building technology to scale mentorship access in underserved schools'
          }
        ]
      }
    },
    extracurricularItems: [
      {
        id: 'student-gov',
        name: 'Student Government President',
        organization: 'Lincoln High School',
        role: 'President',
        startDate: 'September 2021',
        endDate: 'June 2024',
        hoursPerWeek: 12,
        weeksPerYear: 40,
        category: 'leadership' as const,
        description: 'Led 15-member cabinet representing 2,000+ students. Secured $50K budget increase for student programs. Implemented digital feedback system reaching 85% student participation.',
        dateRange: { start: 'September 2021', end: 'June 2024' },
        roleEvolution: { current: 'President' },
        impactMetrics: { tangibilityLevel: 'Highly Quantified' },
        skillsDeveloped: { technical: ['Digital platform management', 'Budget systems', 'Data analysis'] },
        scores: {
          portfolioContribution: {
            overall: 9.2,
            breakdown: {
              commitmentDepth: 9.5,
              leadershipTrajectory: 9.8,
              impactScale: 8.5,
              narrativeAlignment: 9.0
            }
          },
          commitment: {
            overall: 9.5,
            totalHours: 1440,
            consistencyScore: 9.8,
            roleGrowth: ['Member (2021)', 'Secretary (2022)', 'Vice President (2023)', 'President (2024)'],
            hoursPerWeek: 12,
            weeksPerYear: 40
          },
          impact: {
            overall: 8.8,
            metrics: [
              { label: 'Students represented', value: '2,000+' },
              { label: 'Budget increase secured', value: '$50K' },
              { label: 'Participation rate', value: '85%' }
            ],
            tangibility: 9.2,
            analysis: 'Exceptional leadership with concrete outcomes. The digital feedback system demonstrates innovation, while budget increase shows stakeholder negotiation skills.'
          }
        },
        recommendedUse: 'centerpiece' as const,
        applicationGuidance: {
          whyItMatters: 'This student government presidency exemplifies authentic institutional leadership with measurable outcomes. The four-year progression from member to president demonstrates sustained commitment and earned trust, while the $50K budget increase and 85% feedback participation rate provide concrete evidence of negotiation skills and digital innovation.',
          descriptionAnalysis: {
            strengths: ['Clear leadership trajectory over 4 years', 'Quantified budget impact ($50K)', 'Innovation (digital feedback system)', 'High student engagement (85%)'],
            improvements: ['Consider adding specific example of a program funded by budget increase', 'Could mention specific challenges overcome']
          },
          essayFit: [
            {
              promptType: 'Leadership challenge',
              suitability: 9.5,
              angle: 'Implementing digital democracy tools to overcome student apathy'
            },
            {
              promptType: 'Community contribution',
              suitability: 9.0,
              angle: 'Using technology to amplify student voice in school policy'
            }
          ],
          descriptionStrength: {
            clarity: 9.0,
            specificityScore: 9.5,
            actionVerbStrength: 'Strong',
            issues: [],
            improvements: ['Consider adding specific example of a program funded by budget increase']
          }
        },
        evolution: {
          milestones: [
            { date: 'Sep 2021', event: 'Elected Class Representative', significance: 'First leadership role' },
            { date: 'May 2022', event: 'Appointed Secretary', significance: 'Recognized for organizational skills' },
            { date: 'Sep 2023', event: 'Elected Vice President', significance: 'Managed operations and events' },
            { date: 'Sep 2023', event: 'Launched Digital Feedback System', significance: 'Innovation that increased engagement' },
            { date: 'May 2024', event: 'Secured $50K Budget Increase', significance: 'Major negotiation victory' }
          ],
          skillsGained: ['Public speaking', 'Budget management', 'Stakeholder negotiation', 'Digital platform management']
        }
      },
      {
        id: 'tutoring-platform',
        name: 'Community Tutoring Platform',
        organization: 'Self-founded',
        role: 'Founder & Lead Developer',
        startDate: 'January 2022',
        endDate: 'Present',
        hoursPerWeek: 15,
        weeksPerYear: 50,
        category: 'service' as const,
        description: 'Built full-stack web platform connecting volunteer tutors with students. Serves 118 weekly active students across 2 partner schools. Led team of 6 developers and 19 tutors.',
        dateRange: { start: 'January 2022', end: 'Present' },
        roleEvolution: { current: 'Founder & Lead Developer' },
        impactMetrics: { tangibilityLevel: 'Highly Quantified' },
        skillsDeveloped: { technical: ['Full-stack development', 'Product management', 'Database design', 'API development'] },
        scores: {
          portfolioContribution: {
            overall: 9.5,
            breakdown: {
              commitmentDepth: 9.0,
              leadershipTrajectory: 9.2,
              impactScale: 9.8,
              narrativeAlignment: 9.9
            }
          },
          commitment: {
            overall: 9.2,
            totalHours: 1875,
            consistencyScore: 9.5,
            roleGrowth: ['Solo Developer (2022)', 'Team Lead (2023)', 'Program Director (2024)'],
            hoursPerWeek: 15,
            weeksPerYear: 50
          },
          impact: {
            overall: 9.8,
            metrics: [
              { label: 'Weekly active students', value: '118' },
              { label: 'Partner schools', value: '2' },
              { label: 'Tutor team size', value: '19' },
              { label: 'Retention improvement', value: '+12pts' }
            ],
            tangibility: 9.9,
            analysis: 'Exceptional quantifiable impact with institutional partnerships (MOUs). Platform demonstrates sustained operation and measurable outcomes - rare for high school projects.'
          }
        },
        recommendedUse: 'centerpiece' as const,
        applicationGuidance: {
          whyItMatters: 'This self-founded tutoring platform represents exceptional initiative, technical skill, and social entrepreneurship. The formal school partnerships (MOUs) provide rare institutional validation for a high school project, while serving 118 weekly students demonstrates sustained, scalable impact. The evolution from solo developer to program director shows natural leadership development.',
          descriptionAnalysis: {
            strengths: ['Self-initiated enterprise', 'Institutional partnerships (MOUs)', 'Measurable sustained impact (118 weekly users)', 'Team leadership (6 developers, 19 tutors)', 'Clear retention improvement (+12pts)'],
            improvements: ['Perfect as-is. Clear role, concrete metrics, scalable impact.']
          },
          essayFit: [
            {
              promptType: 'Problem you solved',
              suitability: 9.8,
              angle: 'Building technology to democratize access to quality tutoring'
            },
            {
              promptType: 'Impact on community',
              suitability: 9.5,
              angle: 'Scaling mentorship through tech to serve underserved schools'
            },
            {
              promptType: 'Innovation',
              suitability: 9.2,
              angle: 'Technical solution to education equity challenge'
            }
          ],
          descriptionStrength: {
            clarity: 9.5,
            specificityScore: 10.0,
            actionVerbStrength: 'Exceptional',
            issues: [],
            improvements: ['Perfect as-is. Clear role, concrete metrics, scalable impact.']
          }
        },
        evolution: {
          milestones: [
            { date: 'Jan 2022', event: 'Launched MVP', significance: 'First 6 tutors, 12 students' },
            { date: 'Sep 2022', event: 'First School Partnership (MOU)', significance: 'Institutional validation' },
            { date: 'Jan 2023', event: 'Grew to 50+ students', significance: 'Scaling challenge' },
            { date: 'Jun 2023', event: 'Built Developer Team', significance: 'Leadership expansion' },
            { date: 'Sep 2023', event: 'Second School Partnership', significance: 'Multi-school reach' },
            { date: 'Mar 2024', event: 'Reached 118 Weekly Active Users', significance: 'Sustained scale' }
          ],
          skillsGained: ['Full-stack development', 'Product management', 'Partnership development', 'Team leadership', 'User research']
        }
      },
      {
        id: 'robotics-vp',
        name: 'Robotics Club Vice President',
        organization: 'Lincoln High School',
        role: 'Vice President',
        startDate: 'September 2021',
        endDate: 'Present',
        hoursPerWeek: 10,
        weeksPerYear: 45,
        category: 'academic' as const,
        description: 'Manage operations for 35-member team. Designed adaptive controller kits lowering barriers for new members. Led outreach to 3 middle schools, introducing 150+ students to robotics.',
        dateRange: { start: 'September 2021', end: 'Present' },
        roleEvolution: { current: 'Vice President' },
        impactMetrics: { tangibilityLevel: 'Quantified' },
        skillsDeveloped: { technical: ['Robotics engineering', 'CAD design', 'Embedded systems', 'Team management'] },
        scores: {
          portfolioContribution: {
            overall: 8.5,
            breakdown: {
              commitmentDepth: 8.8,
              leadershipTrajectory: 8.5,
              impactScale: 8.2,
              narrativeAlignment: 8.5
            }
          },
          commitment: {
            overall: 8.8,
            totalHours: 1350,
            consistencyScore: 9.0,
            roleGrowth: ['Member (2021)', 'Build Team Lead (2022)', 'Vice President (2023-24)'],
            hoursPerWeek: 10,
            weeksPerYear: 45
          },
          impact: {
            overall: 8.2,
            metrics: [
              { label: 'Team members', value: '35' },
              { label: 'Middle school students reached', value: '150+' },
              { label: 'Adaptive kits designed', value: '18' }
            ],
            tangibility: 8.5,
            analysis: 'Strong operational leadership with innovation (adaptive kits) and outreach focus. Good supporting activity that shows breadth.'
          }
        },
        recommendedUse: 'supporting' as const,
        applicationGuidance: {
          whyItMatters: 'This robotics leadership combines technical operations management with innovation (adaptive kits) and community outreach. The progression from member to Vice President demonstrates genuine technical skill and leadership development, while the middle school outreach (150+ students) shows commitment to STEM pipeline development and accessibility.',
          descriptionAnalysis: {
            strengths: ['Operational leadership (35-member team)', 'Innovation in accessibility (adaptive kits)', 'Community outreach (3 schools, 150+ students)', 'Clear role progression'],
            improvements: ['Could clarify what "adaptive" means - be more specific', 'Add brief explanation: "one-handed controller kits for students with limited dexterity"']
          },
          essayFit: [
            {
              promptType: 'Collaboration',
              suitability: 7.5,
              angle: 'Managing diverse technical team and coordinating with schools'
            },
            {
              promptType: 'Accessibility/inclusion',
              suitability: 8.0,
              angle: 'Designing adaptive tools to lower entry barriers'
            }
          ],
          descriptionStrength: {
            clarity: 8.5,
            specificityScore: 8.8,
            actionVerbStrength: 'Strong',
            issues: ['Could clarify what "adaptive" means - be more specific'],
            improvements: ['Add brief explanation: "one-handed controller kits for students with limited dexterity"']
          }
        },
        evolution: {
          milestones: [
            { date: 'Sep 2021', event: 'Joined as Member', significance: 'First exposure to robotics' },
            { date: 'Jan 2022', event: 'Build Team Lead', significance: 'Technical leadership role' },
            { date: 'Sep 2022', event: 'Elected VP', significance: 'Full operational responsibility' },
            { date: 'Mar 2023', event: 'Designed Adaptive Kits', significance: 'Accessibility innovation' },
            { date: 'Sep 2023', event: 'Started Middle School Outreach', significance: 'Community impact expansion' }
          ],
          skillsGained: ['Mechanical design', 'Team coordination', 'Outreach program management', 'Inclusive design']
        }
      }
    ]
  }
};