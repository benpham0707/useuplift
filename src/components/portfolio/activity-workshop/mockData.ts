// @ts-nocheck
/**
 * Mock data for the Activity Workshop frontend.
 *
 * Uses the REAL ActivityWorkshopPipelineResult type from the backend pipeline.
 * Replace with real API data when the pipeline endpoint is wired up.
 */

import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';

// Re-export the real type so other components can import from here
export type { ActivityWorkshopPipelineResult };

// Activity title lookup for display purposes
export const activityTitles: Record<string, string> = {
  'research': 'ML Healthcare Research',
  'cs-club': 'CS Club Founder & President',
  'farm': 'Family Farm Operations',
  'grocery': 'Grocery Store Shift Lead',
  'tutoring': 'STEM Tutoring Program',
};

// ============================================================================
// SCORING DATA (shared between stage1.scoring and top-level scoring)
// ============================================================================

const activityScoresData = [
  {
    activityId: 'research',
    activityTitle: 'ML Healthcare Research',
    descriptionScore: {
      total: 6.2,
      breakdown: {
        specificity: { score: 6, maxScore: 10, rationale: 'The research topic (ML for healthcare access) is clear and distinctive, but your individual contribution to the project could be sharper. Currently, a reader can\'t tell whether you built the entire pipeline yourself or assisted on a larger team. Since this is fully independent work, the description should make that unmistakably clear.' },
        impactClarity: { score: 5, maxScore: 10, rationale: 'Outcomes are mentioned ("analyze healthcare access gaps") but not quantified. Without accuracy metrics, dataset size, or specific findings, the reader is left to guess the scale and rigor of your work. A 5 is solidly average — adding 2-3 numbers would push this to 8+.' },
        actionLanguage: { score: 7, maxScore: 10, rationale: 'Strong verbs like "developed" and "analyzed" convey genuine agency — you\'re doing the work, not assisting or observing. This is one of the description\'s strongest elements. To reach 9+, consider even more precise verbs: "engineered," "designed," "validated."' },
        quantification: { score: 4, maxScore: 10, rationale: 'This is the biggest gap. Missing key numbers that would transform the description: model accuracy (87%), dataset size (12 healthcare systems), communities served (15,000+ residents). The quantification score is the single most improvable dimension — fixing this alone could raise the overall description score by 1.5+ points.' },
        authenticityVoice: { score: 7, maxScore: 10, rationale: 'The rural healthcare angle is distinctive and clearly personal — this isn\'t a topic chosen for strategic reasons, it comes from lived experience. The authenticity signal is strong. To reach 9+, make the personal connection even more explicit in the description.' },
      },
      strengths: ['Clear research topic', 'Personal connection to rural healthcare'],
      improvements: ['Quantify ML model accuracy', 'Add dataset size and scope metrics'],
      overallRationale: 'The description conveys an impressive research project but relies too heavily on qualitative claims. Adding 2-3 specific metrics would elevate this from a 6 to an 8+.',
      suggestedRewrite: 'Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents; paper submitted to IEEE regional conference.',
    },
    activityScore: {
      total: 8.5,
      breakdown: {
        tierAssessment: { score: 8, maxScore: 10, weight: 0.30, weightedScore: 2.4, rationale: 'Original independent research with real-world application places this solidly in Tier 2', tier: 2 },
        recognitionLevel: { score: 7.5, maxScore: 10, weight: 0.25, weightedScore: 1.875, rationale: 'Paper submitted to regional conference; publication pending', level: 'regional' },
        leadershipImpact: { score: 8, maxScore: 10, weight: 0.125, weightedScore: 1.0, rationale: 'Independent researcher driving the entire project', isApplicable: true, role: 'founder', impactScope: 'community' },
        communityCharacter: { score: 9, maxScore: 10, weight: 0.15, weightedScore: 1.35, rationale: 'Research directly addresses healthcare gaps in own community', primaryTrait: 'curiosity', communityBenefit: 'significant', authenticitySignal: 'highly_authentic' },
        commitmentProgression: { score: 9, maxScore: 10, weight: 0.175, weightedScore: 1.575, rationale: '1.5 years of sustained research with clear progression from data collection to model development', years: 1.5, showsProgression: true, sustainedThroughJunior: true },
        weightConfig: { tierWeight: 0.30, recognitionWeight: 0.25, leadershipWeight: 0.125, communityWeight: 0.15, commitmentWeight: 0.175, leadershipApplicable: true },
      },
      tierJustification: 'Original ML research addressing a real community need. Self-directed methodology, paper submission, and community impact place this at high Tier 2.',
      comparisonBenchmarks: { similarTo: 'Independent research published in regional STEM journal', above: 'NSF-funded lab research with national conference presentation', below: 'Science fair project without external validation' },
      improvementPaths: ['Secure publication in peer-reviewed journal', 'Present at national conference', 'Expand to multi-county dataset'],
      overallRationale: 'Exceptional self-directed research with authentic community motivation. Publication would push toward Tier 1.',
    },
    combinedScore: { total: 8.1, formula: '(8.5 × 0.7) + (6.2 × 0.3)', rationale: 'Strong activity held back slightly by under-quantified description' },
    summary: { oneLiner: 'Impressive self-directed ML research with authentic community impact', topStrength: 'Original research methodology with real-world healthcare application', topImprovement: 'Quantify model performance metrics in description' },
  },
  {
    activityId: 'cs-club',
    activityTitle: 'CS Club Founder & President',
    descriptionScore: {
      total: 5.8,
      breakdown: {
        specificity: { score: 5, maxScore: 10, rationale: 'Founding is clear but day-to-day role and unique contributions need detail' },
        impactClarity: { score: 6, maxScore: 10, rationale: 'Growth mentioned but lacks before/after metrics' },
        actionLanguage: { score: 6, maxScore: 10, rationale: 'Adequate but could use stronger leadership verbs' },
        quantification: { score: 5, maxScore: 10, rationale: 'Missing: initial vs current members, events hosted, curriculum modules' },
        authenticityVoice: { score: 7, maxScore: 10, rationale: 'First-gen student creating CS access is distinctive' },
      },
      strengths: ['Clear founding narrative', 'Educational leadership angle'],
      improvements: ['Add membership growth numbers', 'Specify curriculum created'],
      overallRationale: 'Founding a club is inherently strong but the description doesn\'t maximize the story. Numbers and specifics would transform this.',
    },
    activityScore: {
      total: 8.2,
      breakdown: {
        tierAssessment: { score: 8, maxScore: 10, weight: 0.30, weightedScore: 2.4, rationale: 'Founded and scaled an educational organization — strong Tier 2', tier: 2 },
        recognitionLevel: { score: 7, maxScore: 10, weight: 0.25, weightedScore: 1.75, rationale: 'School-level recognition with growing regional visibility', level: 'school' },
        leadershipImpact: { score: 9, maxScore: 10, weight: 0.125, weightedScore: 1.125, rationale: 'Founded organization from scratch, recruited members, designed curriculum', isApplicable: true, role: 'founder', impactScope: 'organization' },
        communityCharacter: { score: 8.5, maxScore: 10, weight: 0.15, weightedScore: 1.275, rationale: 'Creating CS access for underserved community', primaryTrait: 'service', communityBenefit: 'significant', authenticitySignal: 'highly_authentic' },
        commitmentProgression: { score: 8.5, maxScore: 10, weight: 0.175, weightedScore: 1.4875, rationale: '2 years, grew from founding to established organization', years: 2, showsProgression: true, sustainedThroughJunior: true },
        weightConfig: { tierWeight: 0.30, recognitionWeight: 0.25, leadershipWeight: 0.125, communityWeight: 0.15, commitmentWeight: 0.175, leadershipApplicable: true },
      },
      tierJustification: 'Founded and grew a CS education organization, demonstrating initiative, leadership, and community impact.',
      comparisonBenchmarks: { similarTo: 'Founded school club with 30+ active members and regular programming', above: 'Founded nonprofit that expanded to multiple schools', below: 'Joined existing coding club as member' },
      improvementPaths: ['Expand to other schools in the district', 'Host hackathon or CS competition', 'Partner with local tech companies'],
      overallRationale: 'Founding leadership with clear educational mission. Scale and external partnerships would push toward Tier 1.',
    },
    combinedScore: { total: 7.8, formula: '(8.2 × 0.7) + (5.8 × 0.3)', rationale: 'Strong founding story undermined by generic description' },
    summary: { oneLiner: 'Founded and grew CS education club serving underrepresented students', topStrength: 'Entrepreneurial initiative — created something from nothing', topImprovement: 'Add growth metrics and curriculum specifics to description' },
  },
  {
    activityId: 'farm',
    activityTitle: 'Family Farm Operations',
    descriptionScore: {
      total: 5.5,
      breakdown: {
        specificity: { score: 5, maxScore: 10, rationale: 'Responsibilities mentioned but individual role unclear' },
        impactClarity: { score: 5, maxScore: 10, rationale: 'Farm operations described but economic impact not quantified' },
        actionLanguage: { score: 5, maxScore: 10, rationale: 'Generic verbs — "helped" and "managed" lack precision' },
        quantification: { score: 4, maxScore: 10, rationale: 'Missing: acreage, revenue contribution, animals managed' },
        authenticityVoice: { score: 8, maxScore: 10, rationale: 'Deeply authentic — this is their real life, not a resume builder' },
      },
      strengths: ['Authentic family obligation', 'Shows character depth'],
      improvements: ['Quantify economic contribution', 'Specify management decisions made'],
      overallRationale: 'Authenticity shines through but the description reads as generic farm work. Specific responsibilities and economic impact would make an AO sit up and pay attention.',
    },
    activityScore: {
      total: 7.0,
      breakdown: {
        tierAssessment: { score: 5, maxScore: 10, weight: 0.30, weightedScore: 1.5, rationale: 'Family farm work — meaningful but categorically Tier 3 without external recognition', tier: 3 },
        recognitionLevel: { score: 5, maxScore: 10, weight: 0.25, weightedScore: 1.25, rationale: 'No formal recognition, but AOs value authentic family responsibility', level: 'none' },
        leadershipImpact: { score: 7, maxScore: 10, weight: 0.125, weightedScore: 0.875, rationale: 'Manages operations independently, makes real economic decisions', isApplicable: true, role: 'team_lead', impactScope: 'team' },
        communityCharacter: { score: 9, maxScore: 10, weight: 0.15, weightedScore: 1.35, rationale: 'Demonstrates profound character: responsibility, work ethic, family commitment', primaryTrait: 'resilience', communityBenefit: 'moderate', authenticitySignal: 'highly_authentic' },
        commitmentProgression: { score: 9, maxScore: 10, weight: 0.175, weightedScore: 1.575, rationale: 'Lifelong commitment with increasing responsibility over time', years: 4, showsProgression: true, sustainedThroughJunior: true },
        weightConfig: { tierWeight: 0.30, recognitionWeight: 0.25, leadershipWeight: 0.125, communityWeight: 0.15, commitmentWeight: 0.175, leadershipApplicable: true },
      },
      tierJustification: 'Family farm obligation with real economic responsibility. Tier 3 by classification but carries exceptional character signal that elite AOs deeply value.',
      comparisonBenchmarks: { similarTo: 'Student managing family business while in school', above: 'Student who modernized family farm operations with technology', below: 'Occasional weekend chores on family property' },
      improvementPaths: ['Quantify economic contribution to family', 'Document management innovations implemented', 'Frame as entrepreneurial experience'],
      overallRationale: 'Tier 3 by formal classification but this is the kind of authentic obligation that makes AOs at elite schools take notice. The key is framing.',
    },
    combinedScore: { total: 6.9, formula: '(7.0 × 0.7) + (5.5 × 0.3)', rationale: 'Strong character signal with room for better description framing' },
    summary: { oneLiner: 'Authentic family obligation demonstrating exceptional character', topStrength: 'Deeply authentic — impossible to fabricate or replicate', topImprovement: 'Quantify economic responsibility and management scope' },
  },
  {
    activityId: 'grocery',
    activityTitle: 'Grocery Store Shift Lead',
    descriptionScore: {
      total: 5.2,
      breakdown: {
        specificity: { score: 5, maxScore: 10, rationale: 'Shift lead title is clear but specific duties are vague' },
        impactClarity: { score: 4, maxScore: 10, rationale: 'Promotion mentioned but impact of leadership unclear' },
        actionLanguage: { score: 6, maxScore: 10, rationale: 'Some active verbs but could be stronger' },
        quantification: { score: 4, maxScore: 10, rationale: 'Missing: team size managed, revenue impact, training metrics' },
        authenticityVoice: { score: 6, maxScore: 10, rationale: 'Reads as standard work experience without personal angle' },
      },
      strengths: ['Clear promotion trajectory', 'Shows work ethic'],
      improvements: ['Describe management responsibilities specifically', 'Add team size and operational metrics'],
      overallRationale: 'Earned promotion is a strong signal but the description doesn\'t capitalize on the leadership story. Specifics about what changed after the promotion would strengthen this.',
    },
    activityScore: {
      total: 6.5,
      breakdown: {
        tierAssessment: { score: 4, maxScore: 10, weight: 0.30, weightedScore: 1.2, rationale: 'Paid work with promotion — Tier 4 activity elevated by progression', tier: 4 },
        recognitionLevel: { score: 5, maxScore: 10, weight: 0.25, weightedScore: 1.25, rationale: 'Internal promotion is meaningful recognition of capability', level: 'local' },
        leadershipImpact: { score: 7, maxScore: 10, weight: 0.125, weightedScore: 0.875, rationale: 'Shift lead managing team operations and training new employees', isApplicable: true, role: 'team_lead', impactScope: 'team' },
        communityCharacter: { score: 7, maxScore: 10, weight: 0.15, weightedScore: 1.05, rationale: 'Financial responsibility supporting family, demonstrates maturity', primaryTrait: 'discipline', communityBenefit: 'minimal', authenticitySignal: 'genuine' },
        commitmentProgression: { score: 8, maxScore: 10, weight: 0.175, weightedScore: 1.4, rationale: '3 years with clear promotion from bagger to shift lead', years: 3, showsProgression: true, sustainedThroughJunior: true },
        weightConfig: { tierWeight: 0.30, recognitionWeight: 0.25, leadershipWeight: 0.125, communityWeight: 0.15, commitmentWeight: 0.175, leadershipApplicable: true },
      },
      tierJustification: 'Standard paid employment elevated by earned promotion and sustained commitment. The progression story is the strongest element.',
      comparisonBenchmarks: { similarTo: 'Student promoted to shift manager at retail job', above: 'Student who started small business or created workplace innovation', below: 'Part-time cashier with no progression' },
      improvementPaths: ['Document specific management innovations', 'Quantify team performance improvements', 'Connect work skills to academic goals'],
      overallRationale: 'The promotion narrative and 3-year commitment give this more weight than typical Tier 4 employment. Key is framing the leadership growth.',
    },
    combinedScore: { total: 6.2, formula: '(6.5 × 0.7) + (5.2 × 0.3)', rationale: 'Solid work experience with significant room for better description' },
    summary: { oneLiner: 'Earned promotion showing work ethic and leadership growth', topStrength: 'Clear progression from entry-level to management', topImprovement: 'Describe management responsibilities and team impact' },
  },
  {
    activityId: 'tutoring',
    activityTitle: 'STEM Tutoring Program',
    descriptionScore: {
      total: 6.3,
      breakdown: {
        specificity: { score: 6, maxScore: 10, rationale: 'STEM subjects clear but specific teaching methods not described' },
        impactClarity: { score: 6, maxScore: 10, rationale: 'Student impact implied but not measured' },
        actionLanguage: { score: 7, maxScore: 10, rationale: 'Good use of teaching-oriented action verbs' },
        quantification: { score: 5, maxScore: 10, rationale: 'Missing: students tutored, grade improvements, pass rates' },
        authenticityVoice: { score: 7, maxScore: 10, rationale: 'First-gen student helping others access STEM is compelling' },
      },
      strengths: ['Clear teaching mission', 'Connects to first-gen narrative'],
      improvements: ['Track and report student outcomes', 'Add number of students served'],
      overallRationale: 'Teaching impact is evident but unquantified. Even one specific student success story or aggregate stat would elevate this significantly.',
    },
    activityScore: {
      total: 6.8,
      breakdown: {
        tierAssessment: { score: 5, maxScore: 10, weight: 0.30, weightedScore: 1.5, rationale: 'Tutoring program — Tier 3 service activity with genuine impact', tier: 3 },
        recognitionLevel: { score: 6, maxScore: 10, weight: 0.25, weightedScore: 1.5, rationale: 'School recognition as established tutoring resource', level: 'school' },
        leadershipImpact: { score: 8, maxScore: 10, weight: 0.125, weightedScore: 1.0, rationale: 'Leading tutoring sessions, designing curriculum, mentoring students', isApplicable: true, role: 'team_lead', impactScope: 'organization' },
        communityCharacter: { score: 9, maxScore: 10, weight: 0.15, weightedScore: 1.35, rationale: 'Directly serving underserved STEM students, creating pipeline', primaryTrait: 'service', communityBenefit: 'significant', authenticitySignal: 'highly_authentic' },
        commitmentProgression: { score: 7, maxScore: 10, weight: 0.175, weightedScore: 1.225, rationale: '1.5 years of consistent weekly sessions', years: 1.5, showsProgression: true, sustainedThroughJunior: true },
        weightConfig: { tierWeight: 0.30, recognitionWeight: 0.25, leadershipWeight: 0.125, communityWeight: 0.15, commitmentWeight: 0.175, leadershipApplicable: true },
      },
      tierJustification: 'STEM tutoring with clear community impact. Tier 3 with potential to elevate through documented student outcomes.',
      comparisonBenchmarks: { similarTo: 'Regular volunteer tutor at community center with consistent hours', above: 'Founded tutoring nonprofit serving 100+ students with measured outcomes', below: 'Occasional homework help for friends' },
      improvementPaths: ['Track student grade improvements', 'Expand to more subjects or schools', 'Document specific student success stories'],
      overallRationale: 'Authentic service that reinforces the STEM education narrative. Student outcome data would be transformative.',
    },
    combinedScore: { total: 7.0, formula: '(6.8 × 0.7) + (6.3 × 0.3)', rationale: 'Solid service activity with room to strengthen through measured outcomes' },
    summary: { oneLiner: 'STEM tutoring reinforcing first-gen educational leadership narrative', topStrength: 'Authentic community service creating STEM access pipeline', topImprovement: 'Track and quantify student outcomes' },
  },
];

// ============================================================================
// PORTFOLIO SCORE RUBRIC
// ============================================================================

const portfolioRubricData = {
  overallScore: { total: 7.2, confidence: 0.82, formula: 'Weighted: tier(30%) + spike(25%) + coherence(20%) + major(15%) + presentation(10%)', rationale: 'Strong Tier 2 anchors with authentic first-gen narrative. Spike is emerging but not yet mature. Descriptions need work across the board.' },
  harvardScale: { rating: 3 as 1 | 2 | 3 | 4 | 5 | 6, description: 'Good (top 15%): School leader, meaningful local impact, developing focus', rationale: 'Two Tier 2 activities (research + CS club) with authentic first-gen context and emerging STEM spike. Needs Tier 1 achievement or publication for Outstanding.' },
  breakdown: {
    tierDistribution: { score: 7, maxScore: 10 as 10, rationale: 'Two Tier 2 activities anchor the portfolio. No Tier 1 yet but the research is close.' },
    spikeDetection: { score: 6.5, maxScore: 10 as 10, rationale: 'CS/tech spike is visible through research, CS club, and tutoring, but needs deeper external validation.' },
    coherence: { score: 7.8, maxScore: 10 as 10, rationale: 'Strong thematic coherence — tech for community runs through most activities. Work obligations are authentic outliers.' },
    majorAlignment: { score: 7.5, maxScore: 10 as 10, rationale: 'Strong CS alignment through research and club. Tutoring adds educational dimension.' },
    presentationQuality: { score: 5.8, maxScore: 10 as 10, rationale: 'Descriptions average 5.8/10 — the weakest dimension. Quantification is the primary gap.' },
  },
  narrative: {
    archetype: 'innovator',
    storyLine: 'A resourceful first-gen student who taught themselves ML while working 20 hours/week, then channeled that knowledge into research addressing their own community\'s healthcare gaps and building CS education infrastructure.',
    twoSentencePitch: 'This student doesn\'t just study computer science — they deploy it where it matters most. From ML-powered healthcare research to founding a CS club in an underserved community, they\'re building the tech infrastructure they never had.',
    differentiators: ['Self-taught ML researcher addressing local healthcare gaps', 'Founded CS education pipeline as first-gen student', 'Authentic work/family obligations add character depth'],
    commonalities: ['CS-focused activities (common for STEM applicants)', 'Tutoring (standard service activity)'],
  },
  competitiveContext: {
    assessment: 'Competitive at selective schools, strong at match schools. The research and first-gen narrative create genuine differentiation.',
    targetSchoolFit: 'Strong fit for research-oriented universities that value socioeconomic diversity and community impact.',
    differentiators: ['Independent ML research with community application', 'First-gen narrative with authentic work obligations', 'Founded organization rather than just joining'],
    commonalities: ['CS club (many applicants lead STEM clubs)', 'STEM tutoring (common service choice for CS students)'],
    competitiveGaps: ['No Tier 1 national recognition', 'Research not yet published', 'Missing competitive programming or hackathon results'],
  },
  keyStrengths: ['Authentic first-gen narrative with tech-for-community theme', 'Two Tier 2 anchors (research + founding)', 'Strong coherence score (78/100)'],
  keyGaps: ['No Tier 1 achievement', 'Descriptions under-quantified across the board', 'Spike is emerging, not mature'],
  prioritizedRecommendations: [
    { priority: 1 as 1, recommendation: 'Quantify all activity descriptions — especially research metrics', impact: 'Could raise avg description score from 5.8 to 7.5+', effort: 'low' as 'low' },
    { priority: 2 as 2, recommendation: 'Secure research publication or presentation', impact: 'Would push research toward Tier 1 and improve Harvard Scale', effort: 'medium' as 'medium' },
    { priority: 3 as 3, recommendation: 'Document tutoring outcomes with specific student success data', impact: 'Transforms generic tutoring into measurable community impact', effort: 'low' as 'low' },
  ],
  activityScores: activityScoresData,
  metadata: {
    scoredAt: '2026-02-20T12:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    totalActivities: 5,
    averageDescriptionScore: 5.8,
    averageActivityScore: 7.4,
  },
};

// ============================================================================
// STAGE 1 DATA (AnalysisContext extends PortfolioAnalysis)
// ============================================================================

const stage1Data = {
  // --- Individual Activity Analyses ---
  activities: {
    'research': {
      activityId: 'research',
      classification: { tier: 2, tierConfidence: 'high', tierReasoning: 'Original ML research with real-world application and paper submission elevates beyond school-level achievement', detectedCategory: 'research', categoryConfidence: 0.92 },
      recognition: { level: 'regional', evidence: ['Paper submitted to regional IEEE conference'], authenticityScore: 88, authenticityFactors: ['Original methodology', 'Self-directed project', 'Real dataset'] },
      leadership: { type: 'independent', evidence: ['Solo researcher driving entire project'], impactScope: 'community', leadershipQuality: 'strong' },
      impact: {
        type: 'intellectual',
        evidence: ['NLP analysis identified 3 critical healthcare service gaps in rural communities'],
        quantifiableMetrics: [{ metric: 'Communities analyzed', value: 12, tier: 'significant', verified: false }, { metric: 'Service gaps identified', value: 3, tier: 'moderate', verified: false }],
        impactScore: 82,
        impactNarrative: 'Applied ML to a real community problem, producing actionable insights for healthcare access.',
      },
      timeInvestment: { totalHours: 520, hoursPerWeek: 10, weeksPerYear: 40, yearsInvolved: 1.5, commitmentLevel: 'significant', progressionEvidence: ['Started with data collection, progressed to model development and paper writing'] },
      redFlags: [],
      greenFlags: [
        { flag: 'Original research with real-world application', strength: 'exceptional', evidence: 'Independent ML project addressing rural healthcare gaps using NLP', admissionsValue: 'Demonstrates intellectual curiosity and research capability beyond coursework' },
        { flag: 'Paper submission to peer-reviewed venue', strength: 'strong', evidence: 'Submitted to regional IEEE conference', admissionsValue: 'Shows scholarly ambition and ability to produce publishable work' },
      ],
      descriptionQuality: { specificity: 6, impactClarity: 5, uniqueness: 7, actionVerbs: 6, quantification: 4, overallScore: 5.6, issues: ['Could quantify ML model accuracy'], strengths: ['Clear research topic', 'Personal motivation evident'] },
      databaseMatches: [{ database: 'stem_research', matchedEntry: 'Independent ML Research', tier: 2, relevance: 0.88, insight: 'Self-directed ML research with community application is a strong Tier 2 marker' }],
      narrativePotential: { storytellingValue: 'high', uniqueAngles: ['Rural student using ML for own community healthcare'], emotionalResonance: 'Personal stakes — research addresses gaps affecting their neighbors and family', growthArc: 'Self-taught programmer to published researcher', essayWorthiness: 'excellent' },
      schoolFit: { bestFitSchoolTypes: ['Research universities', 'STEM-focused institutions'], alignedValues: ['intellectual curiosity', 'community impact', 'innovation'], potentialConcerns: [] },
    },
    'cs-club': {
      activityId: 'cs-club',
      classification: { tier: 2, tierConfidence: 'high', tierReasoning: 'Founded and scaled an educational organization — demonstrates initiative and organizational leadership', detectedCategory: 'leadership_clubs', categoryConfidence: 0.90 },
      recognition: { level: 'school', evidence: ['Official school club', 'Growing membership'], authenticityScore: 85, authenticityFactors: ['Founded from scratch', 'Sustained growth', 'Curriculum development'] },
      leadership: { type: 'founder', evidence: ['Created organization from nothing', 'Recruited members', 'Designed curriculum'], impactScope: 'organization', leadershipQuality: 'exceptional' },
      impact: {
        type: 'educational',
        evidence: ['Created CS education access in underserved school'],
        quantifiableMetrics: [{ metric: 'Members recruited', value: 30, tier: 'moderate', verified: false }],
        impactScore: 75,
        impactNarrative: 'Built CS education infrastructure where none existed, creating a pipeline for other first-gen students.',
      },
      timeInvestment: { totalHours: 480, hoursPerWeek: 6, weeksPerYear: 40, yearsInvolved: 2, commitmentLevel: 'significant', progressionEvidence: ['Founded club, then built curriculum, then mentored new leaders'] },
      redFlags: [],
      greenFlags: [
        { flag: 'Founded organization from scratch', strength: 'exceptional', evidence: 'Created CS club where none existed in an underserved school', admissionsValue: 'Founding is one of the strongest leadership signals — shows initiative, vision, and execution' },
        { flag: 'Grew membership significantly', strength: 'strong', evidence: 'Grew from 0 to 30+ active members over 2 years', admissionsValue: 'Demonstrates ability to attract and retain community engagement' },
      ],
      descriptionQuality: { specificity: 5, impactClarity: 6, uniqueness: 6, actionVerbs: 6, quantification: 5, overallScore: 5.6, issues: ['Add specific curriculum details'], strengths: ['Founding narrative is clear', 'Growth story implicit'] },
      databaseMatches: [],
      narrativePotential: { storytellingValue: 'high', uniqueAngles: ['First-gen student creating access they never had'], emotionalResonance: 'Building the bridge for others to follow', growthArc: 'Solo learner to educational leader', essayWorthiness: 'good' },
      schoolFit: { bestFitSchoolTypes: ['Schools valuing entrepreneurship', 'Community-oriented institutions'], alignedValues: ['educational access', 'leadership', 'innovation'], potentialConcerns: [] },
    },
    'farm': {
      activityId: 'farm',
      classification: { tier: 3, tierConfidence: 'medium', tierReasoning: 'Family obligation with real economic responsibility — Tier 3 by category but carries exceptional character signal', detectedCategory: 'family_responsibility', categoryConfidence: 0.88 },
      recognition: { level: 'none', evidence: [], authenticityScore: 95, authenticityFactors: ['Cannot be fabricated', 'Sustained over entire high school', 'Real economic contribution'] },
      leadership: { type: 'operational', evidence: ['Manages daily operations', 'Makes economic decisions'], impactScope: 'team', leadershipQuality: 'solid' },
      impact: {
        type: 'economic',
        evidence: ['Contributes to family livelihood'],
        quantifiableMetrics: [{ metric: 'Years managing operations', value: 4, tier: 'moderate', verified: false }],
        impactScore: 65,
        impactNarrative: 'Sustained family economic contribution while maintaining academic excellence.',
      },
      timeInvestment: { totalHours: 1560, hoursPerWeek: 10, weeksPerYear: 52, yearsInvolved: 4, commitmentLevel: 'exceptional', progressionEvidence: ['Took on increasing responsibility as they got older'] },
      redFlags: [],
      greenFlags: [
        { flag: 'Demonstrates character and responsibility', strength: 'strong', evidence: 'Lifelong commitment to family farm while excelling academically', admissionsValue: 'Shows maturity, work ethic, and character that elite AOs deeply value in first-gen students' },
      ],
      descriptionQuality: { specificity: 5, impactClarity: 5, uniqueness: 8, actionVerbs: 5, quantification: 4, overallScore: 5.4, issues: [], strengths: ['Deeply authentic', 'Unique perspective'] },
      databaseMatches: [],
      narrativePotential: { storytellingValue: 'high', uniqueAngles: ['Farm work as context for ML healthcare research motivation'], emotionalResonance: 'Family duty meets academic ambition', growthArc: 'Rural obligations fueling intellectual pursuit', essayWorthiness: 'good' },
      schoolFit: { bestFitSchoolTypes: ['Schools valuing socioeconomic diversity', 'Rural-friendly institutions'], alignedValues: ['resilience', 'character', 'family commitment'], potentialConcerns: [] },
    },
    'grocery': {
      activityId: 'grocery',
      classification: { tier: 4, tierConfidence: 'high', tierReasoning: 'Standard paid employment, though promotion to shift lead adds distinction', detectedCategory: 'work_experience', categoryConfidence: 0.95 },
      recognition: { level: 'local', evidence: ['Promoted to shift lead'], authenticityScore: 90, authenticityFactors: ['Verifiable employment', 'Earned promotion'] },
      leadership: { type: 'positional', evidence: ['Shift lead managing team of 5-8', 'Training new employees'], impactScope: 'team', leadershipQuality: 'solid' },
      impact: {
        type: 'operational',
        evidence: ['Managing shift operations', 'Training new hires'],
        quantifiableMetrics: [{ metric: 'Team members managed', value: 8, tier: 'minimal', verified: false }],
        impactScore: 55,
        impactNarrative: 'Earned promotion through consistent performance, now managing operations and training.',
      },
      timeInvestment: { totalHours: 3120, hoursPerWeek: 20, weeksPerYear: 52, yearsInvolved: 3, commitmentLevel: 'exceptional', progressionEvidence: ['Bagger → cashier → shift lead over 3 years'] },
      redFlags: [],
      greenFlags: [
        { flag: 'Earned promotion to shift lead', strength: 'notable', evidence: 'Promoted from entry-level to management over 3 years', admissionsValue: 'Demonstrates work ethic, reliability, and leadership potential' },
      ],
      descriptionQuality: { specificity: 5, impactClarity: 4, uniqueness: 4, actionVerbs: 6, quantification: 4, overallScore: 4.6, issues: ['Describe management responsibilities'], strengths: ['Promotion trajectory is clear'] },
      databaseMatches: [],
      narrativePotential: { storytellingValue: 'medium', uniqueAngles: ['20-hour work week as context for how hard this student works'], emotionalResonance: 'Supporting family through consistent labor', growthArc: 'Entry-level to management responsibility', essayWorthiness: 'possible' },
      schoolFit: { bestFitSchoolTypes: ['Schools valuing socioeconomic diversity'], alignedValues: ['work ethic', 'responsibility'], potentialConcerns: [] },
    },
    'tutoring': {
      activityId: 'tutoring',
      classification: { tier: 3, tierConfidence: 'medium', tierReasoning: 'Structured tutoring program with consistent hours and clear educational impact', detectedCategory: 'community_service', categoryConfidence: 0.85 },
      recognition: { level: 'school', evidence: ['Recognized as go-to STEM tutor'], authenticityScore: 82, authenticityFactors: ['Regular schedule', 'Subject expertise demonstrated'] },
      leadership: { type: 'teaching', evidence: ['Leading sessions', 'Designing lesson plans'], impactScope: 'organization', leadershipQuality: 'strong' },
      impact: {
        type: 'educational',
        evidence: ['Direct student academic improvement'],
        quantifiableMetrics: [{ metric: 'Students tutored', value: 25, tier: 'moderate', verified: false }],
        impactScore: 68,
        impactNarrative: 'Creating STEM access for underserved students through dedicated weekly tutoring.',
      },
      timeInvestment: { totalHours: 360, hoursPerWeek: 6, weeksPerYear: 40, yearsInvolved: 1.5, commitmentLevel: 'moderate', progressionEvidence: ['Started with math, expanded to physics and CS topics'] },
      redFlags: [],
      greenFlags: [
        { flag: 'Direct student impact', strength: 'strong', evidence: 'Weekly sessions with 25+ students across STEM subjects', admissionsValue: 'Shows commitment to educational equity and ability to communicate complex concepts' },
      ],
      descriptionQuality: { specificity: 6, impactClarity: 6, uniqueness: 5, actionVerbs: 7, quantification: 5, overallScore: 5.8, issues: ['Track student outcomes'], strengths: ['Clear teaching focus', 'Subject breadth evident'] },
      databaseMatches: [],
      narrativePotential: { storytellingValue: 'medium', uniqueAngles: ['First-gen student creating the support system they never had'], emotionalResonance: 'Paying it forward', growthArc: 'Helped individual students, then built a program', essayWorthiness: 'possible' },
      schoolFit: { bestFitSchoolTypes: ['Schools valuing service', 'Education-oriented institutions'], alignedValues: ['service', 'educational access', 'mentorship'], potentialConcerns: [] },
    },
  },

  // --- Portfolio-Level Analysis ---
  tierDistribution: { tier1: 0, tier2: 2, tier3: 2, tier4: 1, portfolioTier: 2, tierRationale: 'Two Tier 2 activities anchor the portfolio at the Tier 2 level' },
  spikeAnalysis: {
    hasSpike: true,
    spikeType: 'stem',
    spikeStrength: 'moderate',
    spikeActivities: ['research', 'cs-club', 'tutoring'],
    spikeEvidence: ['ML research with real-world application', 'Founded CS education organization', 'STEM tutoring program'],
    spikeAuthenticity: 78,
    spikeNarrative: 'Emerging CS/tech spike visible through research, CS club founding, and STEM tutoring. Needs deeper external validation to mature.',
    spikeDevelopmentStage: 'emerging',
  },
  coherenceAnalysis: {
    score: 78,
    assessment: 'strong',
    primaryTheme: 'Technology as Community Infrastructure',
    secondaryThemes: ['First-Generation STEM Pipeline Builder', 'Responsibility-Driven Excellence'],
    thematicConnections: [
      { activity1: 'research', activity2: 'cs-club', connection: 'Both create CS knowledge and infrastructure', strength: 'strong' },
      { activity1: 'cs-club', activity2: 'tutoring', connection: 'Both serve educational access mission', strength: 'strong' },
      { activity1: 'grocery', activity2: 'farm', connection: 'Both demonstrate work ethic and family responsibility', strength: 'moderate' },
    ],
    disconnectedActivities: [],
    narrativeThread: 'A resourceful first-gen student building technology infrastructure for their underserved community while shouldering real family and work obligations.',
  },
  majorAlignment: {
    intendedMajor: 'computer_science',
    alignmentScore: 82,
    stronglyAligned: ['research', 'cs-club'],
    moderatelyAligned: ['tutoring'],
    misaligned: [],
    gaps: ['No competitive programming or hackathon results'],
    competitiveBenchmark: 'Strong alignment for CS major — research and founding differentiate from typical CS applicants.',
  },
  depthBreadthProfile: { profile: 'focused', depthScore: 75, breadthScore: 55, optimalBalance: 'Slightly deep-leaning, which is ideal for STEM applicants. Work/farm obligations provide authentic breadth.' },
  hiddenGems: {
    undersoldActivities: [
      { activityId: 'farm', currentPresentation: 'Listed as family obligation', trueValue: 'Provides authentic motivation for healthcare research and exceptional character signal', whyUndersold: 'Described generically without connecting to broader narrative' },
    ],
    workFamilyContributions: { present: true, activities: ['grocery', 'farm'], value: 'Transforms the entire portfolio — 20+ hours/week of paid work makes every academic achievement more impressive' },
    constrainedExcellence: { present: true, context: 'First-gen, rural, 20+ hours/week of work obligations', activities: ['research', 'cs-club'] },
  },
  competitiveAssessment: {
    overallStrength: 'competitive',
    strengthAreas: ['Authentic first-gen narrative', 'Original research', 'Founding leadership'],
    weaknessAreas: ['No Tier 1 national recognition', 'Descriptions under-quantified'],
    differentiators: ['ML research on own community healthcare', 'Work obligations elevate every achievement'],
    commonalities: ['CS club (many applicants lead STEM clubs)', 'Tutoring (standard service activity)'],
    competitiveEdge: 'The intersection of authentic economic constraint and high intellectual achievement creates a profile that is impossible to fabricate.',
  },
  gapsIdentified: [
    { gap: 'No Tier 1 (national/international) recognition', severity: 'significant', impactOnApplication: 'Limits competitiveness at most selective schools', affectedSchools: ['Ivy League', 'Stanford', 'MIT'] },
    { gap: 'Missing competitive programming or hackathon results', severity: 'minor', impactOnApplication: 'Common for CS applicants but not required given research strength', affectedSchools: ['MIT', 'CMU'] },
  ],
  commonAppReadiness: {
    readyForSubmission: false,
    activitiesCount: 5,
    topActivitiesIdentified: ['research', 'cs-club', 'farm'],
    orderingRecommendation: ['research', 'cs-club', 'farm', 'grocery', 'tutoring'],
    descriptionReadiness: [
      { activityId: 'research', ready: false, issues: ['Needs quantified metrics'] },
      { activityId: 'cs-club', ready: false, issues: ['Needs specific growth numbers'] },
      { activityId: 'farm', ready: true, issues: [] },
      { activityId: 'grocery', ready: false, issues: ['Needs management detail'] },
      { activityId: 'tutoring', ready: false, issues: ['Needs student outcome data'] },
    ],
  },
  analysisConfidence: {
    overallConfidence: 82,
    dataQuality: 78,
    classificationConfidence: 88,
    spikeConfidence: 72,
    factors: [
      { factor: 'Detailed activity descriptions provided', impact: 'positive', score: 80 },
      { factor: 'First-gen context clearly articulated', impact: 'positive', score: 90 },
      { factor: 'Research details could be more specific', impact: 'negative', score: 65 },
    ],
  },

  // --- AnalysisContext additions (beyond PortfolioAnalysis) ---
  storyEnrichment: {
    storyContextUsed: true,
    storyInfluencedScores: [
      { activityId: 'farm', originalTierEstimate: 4, adjustedTier: 3, adjustmentReason: 'Story context revealed this is a genuine family obligation with character depth, not mere participation' },
      { activityId: 'grocery', originalTierEstimate: 4, adjustedTier: 4, adjustmentReason: 'Work context confirmed: financial necessity, not resume padding' },
    ],
  },
  teachingCandidates: {
    deepTeachingIds: ['research', 'cs-club'],
    mediumTeachingIds: ['farm', 'grocery'],
    quickEncouragementIds: ['tutoring'],
    skipTeachingIds: [],
    selectionCriteria: { deepThreshold: 7.5, mediumThreshold: 5.0, skipThreshold: 9.0 },
  },
  teachingPriorities: [
    { activityId: 'research', priority: 1, reason: 'Highest-potential activity with clear improvement paths', expectedImpact: 'transformative', teachingFocus: ['description quantification', 'publication strategy'] },
    { activityId: 'cs-club', priority: 2, reason: 'Strong foundation needing metric-based strengthening', expectedImpact: 'significant', teachingFocus: ['growth documentation', 'impact measurement'] },
    { activityId: 'farm', priority: 3, reason: 'Hidden gem needing better framing', expectedImpact: 'significant', teachingFocus: ['narrative framing', 'character signal'] },
    { activityId: 'grocery', priority: 4, reason: 'Needs management detail to maximize value', expectedImpact: 'moderate', teachingFocus: ['management responsibilities', 'leadership growth'] },
    { activityId: 'tutoring', priority: 5, reason: 'Already decent, just needs outcome tracking', expectedImpact: 'moderate', teachingFocus: ['outcome documentation'] },
  ],
  portfolioTeachingNeeds: {
    primaryIssue: 'Descriptions are under-quantified across all activities',
    primaryIssueSeverity: 'significant',
    secondaryIssues: ['Spike needs deeper external validation', 'Farm obligation undersold in narrative'],
    strengthsToHighlight: ['Authentic first-gen narrative', 'Original research', 'Founding leadership'],
    strategicGaps: ['No Tier 1 recognition', 'Missing competitive programming results'],
  },
  scoring: {
    portfolioRubric: portfolioRubricData,
    activityScoresById: Object.fromEntries(activityScoresData.map(s => [s.activityId, s])),
    scoringComplete: true,
  },
  analysisMetadata: {
    generatedAt: '2026-02-20T12:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    tokensUsed: { input: 4500, output: 8200 },
    cost: 0.12,
    storyContextProvided: true,
  },
};

// ============================================================================
// MOCK DATA
// ============================================================================

export const MOCK_DATA: ActivityWorkshopPipelineResult = {
  sessionId: 'mock-session-001',
  version: '4.3.0',
  completedAt: '2026-02-20T12:00:00Z',

  // ==========================================================================
  // STAGE 0: Story Context
  // ==========================================================================
  stage0: {
    narrativeIdentity: {
      primaryTheme: 'Technology as Community Infrastructure',
      secondaryThemes: ['Responsibility-Driven Excellence', 'First-Generation STEM Pipeline Builder'],
      storyEssence: 'A first-gen student who creates infrastructure and teaches others, driven by genuine intellectual curiosity in CS and deep responsibility to their community and family.',
      archetype: 'innovator',
      archetypeConfidence: 78,
    },
    narrativeThreads: [
      { thread: 'Technology as Community Infrastructure', activityIds: ['cs-club', 'research', 'tutoring'], strength: 'strong', evidence: 'Founded CS club, conducts ML research on rural healthcare, tutors STEM students' },
      { thread: 'Responsibility-Driven Excellence', activityIds: ['grocery', 'farm', 'research'], strength: 'emerging', evidence: 'Balances paid work, farm duties, and academic research simultaneously' },
      { thread: 'First-Generation STEM Pipeline Builder', activityIds: ['cs-club', 'tutoring', 'research'], strength: 'emerging', evidence: 'Creating pathways for other first-gen students through teaching and mentorship' },
    ],
    contextualFactors: {
      hasWorkFamilyObligations: true,
      workFamilyContext: 'Works 20 hours/week at grocery store, helps manage family farm',
      hasResourceConstraints: true,
      constraintsContext: 'Rural community with limited STEM resources',
      hasGeographicLimitations: true,
      geographicContext: 'Rural area — limited access to research institutions and STEM programs',
      firstGenIndicators: true,
      internationalIndicators: false,
    },
    activityStoryRoles: [
      { activityId: 'research', storyRole: 'core_identity', centralityScore: 92, roleExplanation: 'Strongest differentiator — original ML research on rural healthcare' },
      { activityId: 'cs-club', storyRole: 'passion_pursuit', centralityScore: 85, roleExplanation: 'Shows initiative and educational leadership' },
      { activityId: 'farm', storyRole: 'obligation', centralityScore: 70, roleExplanation: 'Most compelling first-gen context story' },
      { activityId: 'grocery', storyRole: 'obligation', centralityScore: 65, roleExplanation: 'Work ethic, earned promotion to shift lead' },
      { activityId: 'tutoring', storyRole: 'impact_vehicle', centralityScore: 75, roleExplanation: 'Reinforces teaching theme and community impact' },
    ],
    spikeHypothesis: {
      likelySpike: true,
      spikeArea: 'Computer Science & Educational Leadership',
      spikeActivityIds: ['research', 'cs-club', 'tutoring'],
      maturity: 'emerging',
      evidence: 'Three CS-related activities spanning research, education, and service. Needs deeper external validation to mature.',
    },
    metadata: {
      generatedAt: '2026-02-20T11:58:00Z',
      modelUsed: 'claude-haiku-4-5-20251001',
      tokensUsed: { input: 1200, output: 2800 },
      cost: 0.02,
    },
  },

  // ==========================================================================
  // STAGE 1: Analysis Context (extends PortfolioAnalysis)
  // ==========================================================================
  stage1: stage1Data,

  // ==========================================================================
  // STAGE 2: Teaching Context
  // ==========================================================================
  stage2: {
    teachingDelivered: [
      {
        activityId: 'research',
        teachingDepth: 'deep',
        teaching: {
          activityId: 'research',
          celebration: {
            headline: 'You\'re doing real research that matters — that puts you ahead of 95% of applicants. Independent ML research on a genuine community healthcare problem, with a paper submitted to a peer-reviewed venue, is the kind of intellectual initiative that makes admissions officers stop and pay attention.',
            strengths: [
              'Original ML methodology applied to a genuine community problem — you didn\'t just follow a tutorial or replicate existing work. You identified a real gap in rural healthcare access, designed an NLP pipeline to analyze it, and produced actionable insights. That\'s the kind of independent scholarly work that research universities actively seek.',
              'Self-directed initiative without institutional support — most high school research happens in university labs with PhD mentors guiding every step. You taught yourself the methodology, sourced your own data, and drove the project from conception to paper submission. Admissions committees at MIT, Stanford, and Carnegie Mellon specifically flag this kind of autonomous research capability.',
              'Paper submission shows scholarly ambition — submitting to IEEE\'s regional conference demonstrates that you understand the academic publication process and have the confidence to put your work before expert reviewers. Even if the paper isn\'t accepted, the act of submission itself signals a maturity that most high school applicants never reach.',
            ],
          },
          tierExplanation: {
            assignedTier: 2,
            explanation: { text: 'Your research earns Tier 2 because it demonstrates independent intellectual work with real-world application. Self-directed ML research on community healthcare goes well beyond typical school projects — it shows the kind of intellectual autonomy that research universities specifically seek.\n\nTier 2 activities are characterized by "significant achievement or leadership requiring sustained commitment and producing measurable impact beyond the immediate school community." Your research meets every criterion: sustained commitment (1.5 years), measurable impact (3 healthcare gaps identified across 12 systems), and reach beyond school (paper submitted to IEEE, community healthcare implications).\n\nThis places you in the top 5-10% of high school research activities, according to admissions benchmarks. The gap to Tier 1 is narrow — publication or national recognition would close it.', citations: [] },
            benchmarksUsed: [
              { tier: 2, benchmark: 'Independent research with external validation', source: 'Sara Harberson framework', studentMeets: true, evidence: 'Paper submitted to IEEE regional conference, independent methodology, real-world dataset' },
              { tier: 1, benchmark: 'Published research or national recognition', source: 'Sara Harberson framework', studentMeets: false, gap: 'Paper not yet published — but submission itself is a strong signal of scholarly intent' },
            ],
            whatMakesThisTier: { text: 'Three factors place this at Tier 2: (1) original methodology — you developed the NLP pipeline yourself rather than following a prescribed research protocol, (2) real dataset with community implications — this isn\'t synthetic data or a classroom exercise, and (3) paper submission to a recognized venue — IEEE\'s regional conference applies academic peer review standards. Together, these elements distinguish your work from the vast majority of high school research, which typically involves lab assistance or science fair projects without external review.', citations: [] },
            whatWouldChangeIt: { text: 'A published paper or presentation at a recognized conference would push this toward Tier 1. Specifically, any of these milestones would close the gap: (1) IEEE paper acceptance and publication, (2) presentation at Regeneron STS, JSHS, or a comparable national symposium, (3) expansion of the research to a multi-county analysis with formal partnership with a health organization. The most achievable path is following up on the IEEE submission — even a revision and resubmission demonstrates the perseverance that Tier 1 research requires.', citations: [] },
          },
          strengthTeaching: [
            {
              strength: 'Original research with community application',
              whyItMatters: {
                text: 'Self-directed research is the single strongest differentiator for STEM applicants at selective schools. Here\'s why this matters so much for your application.\n\nWhen admissions officers at research universities like MIT, Stanford, or Carnegie Mellon review thousands of applications, they\'re looking for evidence that a student can do more than follow instructions. They want to see intellectual curiosity that drives independent investigation — and your ML healthcare research is exactly that signal.\n\nThe admissions psychology here is straightforward: anyone can get an A in AP Computer Science. Far fewer students will identify a real problem in their community, teach themselves NLP methodology, and produce original analysis. That gap between "good student" and "independent researcher" is where selective admissions decisions are made.\n\nResearch from the Harvard Graduate School of Education\'s "Turning the Tide" report emphasizes that colleges are increasingly seeking students who demonstrate "contributions to others, their communities, and the public good" through authentic intellectual engagement. Your rural healthcare NLP project hits this standard directly — it\'s not a manufactured activity, it\'s genuine problem-solving.\n\nFormer MIT admissions officer Chris Peterson notes that "the students who stand out aren\'t the ones with the most activities — they\'re the ones who\'ve gone deepest in something that genuinely matters to them." Your research demonstrates exactly this kind of depth.',
                citations: [],
                psychology: 'When an admissions committee member picks up your application, they\'re mentally sorting it into one of three categories: "standard strong applicant," "interesting but unproven," or "this student is already doing the work." Your research puts you squarely in the third category.\n\nAdmissions officers at research universities have a specific mental model for evaluating STEM applicants. They ask: "Can this student handle the transition from consuming knowledge to producing it?" Most applicants can only point to coursework and test scores — consumption metrics. Your ML project is a production metric. You\'ve already crossed the threshold from student to researcher.\n\nThe psychological impact of this on a reader is significant. When they see "developed NLP model analyzing rural healthcare systems," they immediately shift their evaluation framework from "is this student prepared for college?" to "what will this student contribute to our research community?" That reframing is what separates competitive applications from compelling ones.',
                research: 'A 2023 study by the National Association for College Admission Counseling found that "demonstrated interest in a specific academic area through independent projects or research" ranked in the top 5 factors for selective STEM admissions. Additionally, the MIT admissions blog has repeatedly emphasized that "passion demonstrated through action" outweighs traditional metrics like GPA and test scores for borderline candidates.\n\nThe data is clear: at schools where the admit rate is below 15%, the differentiating factor is almost never academic performance (since nearly all applicants have stellar grades). Instead, it\'s evidence of intellectual initiative — exactly what your research represents.',
                quote: '"The students who change the world aren\'t the ones who got perfect scores — they\'re the ones who saw a problem nobody else was solving and decided to solve it themselves."',
                quoteSource: 'Dr. Maria Klawe, former president of Harvey Mudd College',
              },
              howToLeverage: 'Lead with this in your application narrative — it\'s your strongest card. Here\'s how to maximize its impact:\n\nFirst, make this the #1 activity on your Common App activities list. Admissions officers read activities in order, and the first slot sets the frame for everything that follows. When research is first, every subsequent activity is read through the lens of "this is someone who does independent research."\n\nSecond, connect it to your broader narrative. Your research isn\'t just a standalone project — it\'s the culmination of your CS journey and the most concrete expression of your "technology for community impact" theme. Reference it in your personal statement, additional information section, and school-specific essays wherever natural.\n\nThird, prepare to discuss it in depth during interviews. Have a 2-minute version (the "elevator pitch"), a 5-minute version (the "technical walkthrough"), and be ready for probing questions about methodology, limitations, and future directions.',
              inApplications: 'Position as the centerpiece of your Common App activities list. Here\'s the specific strategy:\n\nIn the Activities section, this should be activity #1. Use the optimized description with quantified metrics. For the position/role, write "Independent Researcher" (not "Student Researcher" — you didn\'t have a mentor, own that).\n\nIn the Additional Information section, consider a 2-3 sentence expansion: "This research was entirely self-directed — I taught myself NLP methodology through online courses and academic papers, sourced my own dataset from public health records, and developed the analysis pipeline independently. The paper is currently under review at IEEE\'s regional conference."\n\nFor school-specific essays, this is golden material. MIT\'s "describe something you do for the pleasure of it" essay, Stanford\'s "what matters to you and why," and similar prompts all connect naturally to your research motivation story.',
            },
          ],
          improvementTeaching: [
            {
              issue: 'Description lacks quantification',
              whyItMatters: {
                text: 'Admissions officers process 30+ applications per day — often spending as little as 6-8 minutes per file at the most selective schools. In that compressed reading window, numbers are the fastest signal of credibility and scale.\n\nHere\'s the psychology: when a reader sees "developed ML model analyzing healthcare gaps," they file it as "student did a project." When they see "developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents," they file it as "student produced measurable research impact." The difference in categorization is dramatic, and it happens in seconds.\n\nResearch on admissions decision-making consistently shows that quantified claims are perceived as 2-3x more credible than qualitative ones. This isn\'t because numbers are inherently more impressive — it\'s because they signal that you\'ve actually measured your work and can speak to its specifics. Vague claims invite skepticism; specific numbers invite respect.\n\nThe Common App gives you exactly 150 characters per activity description. Every word must earn its place. Right now, your description uses those characters on qualitative claims that could apply to dozens of applicants. With quantification, those same 150 characters become a miniature research abstract that no other applicant can replicate.',
                citations: [],
                psychology: 'The admissions psychology here is rooted in what researchers call "specificity credibility" — the phenomenon where detailed, specific claims are perceived as more trustworthy and impressive than general ones, even when the underlying achievement is identical.\n\nWhen an admissions officer reads "developed ML model for healthcare," their brain automatically generates a low-confidence estimate of what that means. Maybe it\'s a simple linear regression on a dataset from Kaggle. Maybe it\'s a sophisticated NLP pipeline. They don\'t know, so they assume average.\n\nBut when they read "NLP model (87% accuracy) analyzing 12 healthcare systems," there\'s no ambiguity. The specific numbers force the reader to engage with the actual scope of your work. And because most applicants DON\'T quantify their descriptions, doing so immediately signals a level of self-awareness and rigor that sets you apart.',
                research: 'A landmark study by the University of Michigan\'s Center for Enrollment Research found that among applications with similar activity profiles, those with quantified descriptions received "strong" ratings 67% more often than those with qualitative-only descriptions. The researchers attributed this to what they called the "concreteness advantage" — readers naturally trust specific claims over general ones.\n\nAdditionally, former Stanford admissions officer Jon Reider has noted that "the most common mistake I see in activity descriptions is telling us what you did without telling us how much, how many, or what happened as a result."',
                quote: '"Numbers don\'t lie, and they don\'t bore. When I see a student who can quantify their impact, I know they understand what they actually accomplished — not just what title they held."',
                quoteSource: 'Former Columbia University admissions committee member',
              },
              howToFix: 'Add 2-3 specific metrics: model accuracy, dataset size, communities impacted. Here\'s the step-by-step process:\n\nStep 1: Identify your three strongest numbers. For ML research, the most impactful metrics are: (a) model performance (accuracy, F1, precision/recall), (b) dataset scale (records processed, sources analyzed), and (c) real-world scope (communities served, population affected). Pick the three that are most impressive.\n\nStep 2: Integrate naturally. Don\'t just list numbers — weave them into the narrative. "Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems" flows better than "Developed NLP model. Accuracy: 87%. Systems analyzed: 12."\n\nStep 3: Verify the 150-character limit. The optimized version we suggest is 148 characters — right at the sweet spot. Every character is working hard.',
              exampleBefore: 'Developed ML model analyzing healthcare gaps in rural communities. Submitted paper to regional conference.',
              exampleAfter: 'Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents [REF: IEEE regional conf.]',
              transformationAnalysis: 'Let\'s break down exactly what changed and why each change matters:\n\nChange 1: "ML model" → "NLP model (87% accuracy)"\nThis transforms a generic technology claim into a specific, verifiable achievement. "ML" could mean anything from a simple decision tree to a neural network. "NLP model with 87% accuracy" tells the reader exactly what type of ML and exactly how well it performs. The accuracy metric also implies rigorous evaluation — you didn\'t just build something, you measured it.\n\nChange 2: "healthcare gaps in rural communities" → "12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents"\nThis is the biggest upgrade. The original phrasing is abstract — "healthcare gaps" could be theoretical. The revised version is concrete: 12 systems analyzed, 3 gaps identified, 15,000+ people affected. Each number adds a layer of credibility and scale.\n\nChange 3: Adding the REF marker for IEEE\nNaming the specific conference venue (IEEE) adds institutional credibility. "Regional conference" is vague; "IEEE regional conference" signals that your work met the submission standards of a recognized professional organization.\n\nNet effect: The description went from a qualitative project summary to a quantified research abstract. An admissions officer reading this immediately understands the technical sophistication, scale, and real-world impact of your work.',
              priority: 'high',
            },
          ],
          descriptionOptimization: {
            originalDescription: 'Developed machine learning model to analyze healthcare access gaps in rural communities. Submitted paper to regional conference.',
            optimizedDescription: 'Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents; paper submitted to IEEE regional conference.',
            characterCount: 148,
            changesExplained: [
              { change: 'Added accuracy metric (87%)', reason: 'Quantifies technical achievement — transforms "I built a model" into "I built a model that works"' },
              { change: 'Added scope (12 systems, 15,000+ residents)', reason: 'Shows scale and real-world impact — this isn\'t a toy project, it has measurable scope' },
              { change: 'Specified conference (IEEE)', reason: 'Adds credibility through named venue — "regional conference" is vague, "IEEE" is a recognized brand' },
            ],
            alternativeVersions: [
              'Built NLP pipeline analyzing healthcare access across 12 rural counties; identified 3 critical service deserts affecting 15K+ residents. Paper under review, IEEE.',
              'Independent ML research: developed 87%-accurate NLP model mapping healthcare gaps in rural communities; findings submitted to IEEE conference for publication.',
            ],
          },
          upgradePathway: {
            currentTier: 2,
            targetTier: 1,
            feasibility: 'High — you\'re one major milestone away from Tier 1. Publication or a national conference presentation would close the gap.',
            timeRequired: '3-6 months',
            steps: [
              { step: 1, action: 'Follow up on IEEE paper submission status', milestone: 'Paper accepted or feedback received', timeframe: '1-2 months' },
              { step: 2, action: 'If rejected, revise based on reviewer feedback and resubmit to another venue', milestone: 'Revised paper submitted', timeframe: '1-2 months after feedback' },
              { step: 3, action: 'Apply to present at a national STEM symposium (e.g., Regeneron STS, JSHS)', milestone: 'Accepted to present at recognized venue', timeframe: '3-4 months' },
              { step: 4, action: 'Expand dataset to multi-county analysis for stronger findings', milestone: 'Dataset expanded, new results validated', timeframe: '2-3 months' },
            ],
            successIndicators: ['Paper published or accepted at recognized venue', 'Presentation at state or national conference', 'Research cited or referenced by a healthcare organization', 'Dataset expanded beyond original scope'],
            risks: ['Paper rejection could be discouraging — frame it as normal in academic research', 'Time constraints from work and school may slow progress', 'Expanding the dataset requires access to additional county health records'],
          },
          narrativeGuidance: {
            howToTalkAboutThis: { text: 'Frame this as the culmination of your CS journey — you didn\'t just learn to code, you applied it to solve a problem in your own community. This narrative framing is critical because it transforms a technical project into a character story.\n\nWhen discussing this research, always start with the "why" before the "what." Don\'t lead with "I built an NLP model." Lead with "Growing up on a farm in a rural community, I saw firsthand how far people had to drive just to see a doctor. When I learned about machine learning, I realized I could use data to map exactly where the gaps were — and that\'s what I did."\n\nThis framing accomplishes three things: (1) it establishes authentic motivation rooted in lived experience, (2) it demonstrates the progression from personal observation to technical action, and (3) it connects your farm/work background to your intellectual pursuits in a way that feels natural rather than manufactured.\n\nIn interviews, be prepared for the follow-up question: "What did you find, and what happened with the results?" Have a specific answer ready — name one of the three service gaps you identified and explain what it means for real people in your community.', citations: [] },
            uniqueAngle: 'Rural student using cutting-edge ML to address gaps in their own community\'s healthcare',
            connectionToStory: 'This is where your farm/work experience and CS passion intersect — your lived experience gave you the motivation and perspective to tackle this research. The fact that you work 20 hours a week at a grocery store and help manage a family farm makes the research even more impressive — you didn\'t have the luxury of a summer at a university lab. You built this in the margins of an already demanding life.',
            interviewTips: ['Explain what sparked the research idea — connect it to a specific moment or observation from your rural community', 'Describe a specific technical challenge you overcame — the NLP pipeline for unstructured health data is a great example', 'Connect to your community\'s real healthcare needs — name a specific gap you discovered', 'Be ready to discuss limitations and what you\'d do differently — this shows intellectual maturity'],
            essayPotential: { viable: true, angle: 'The moment you realized you could use code to map the healthcare gaps you\'d seen growing up on the farm — bridging the distance between rural life and cutting-edge technology', cautionAreas: ['Avoid making the research sound like a savior narrative — focus on what you learned, not what you "fixed"', 'Don\'t oversell the technical complexity — admissions officers value clarity over jargon', 'Be honest about limitations — a 87% accuracy model has a 13% error rate, and acknowledging that shows maturity'] },
          },
        },
      },
      {
        activityId: 'cs-club',
        teachingDepth: 'deep',
        teaching: {
          activityId: 'cs-club',
          celebration: {
            headline: 'You didn\'t join a club — you created an institution. That\'s leadership. In the world of college admissions, the distinction between "president of existing club" and "founded a new organization" is enormous. You saw a gap in your school\'s offerings, took initiative to fill it, and built something that will outlast your time there.',
            strengths: [
              'Built something from nothing — you didn\'t inherit a functioning organization and maintain it. You identified a need (CS education in an underserved school), recruited founding members, designed a curriculum, and grew the club to 30+ active members. That\'s entrepreneurial leadership, not positional leadership.',
              'Created CS access for underserved students — this isn\'t just a club, it\'s infrastructure. In a school that didn\'t offer CS education, you created the pipeline. That kind of initiative is exactly what admissions officers at schools like MIT and Stanford describe as "impact beyond self."',
              'Designed original curriculum with real depth — an 8-module curriculum covering Python and web development shows pedagogical thinking. You didn\'t just run meetings — you built a learning experience from scratch.',
            ],
          },
          tierExplanation: {
            assignedTier: 2,
            explanation: { text: 'Founding and growing an educational organization demonstrates initiative that most students never show. This earns Tier 2.', citations: [] },
            benchmarksUsed: [
              { tier: 2, benchmark: 'Founded organization with meaningful growth', source: 'Sara Harberson framework', studentMeets: true, evidence: 'Grew to 30+ members, designed curriculum' },
            ],
            whatMakesThisTier: { text: 'Founders who build something lasting stand out. You didn\'t just hold a title — you created infrastructure.', citations: [] },
            whatWouldChangeIt: { text: 'Expanding to other schools or achieving district/state recognition would push toward Tier 1.', citations: [] },
          },
          strengthTeaching: [
            {
              strength: 'Founding leadership',
              whyItMatters: {
                text: 'In the admissions world, founding beats presiding — by a significant margin. Here\'s why this distinction matters so much for your application.\n\nAnyone can run for president of an existing club. It requires campaigning, maybe giving a speech, and then managing an organization that someone else built. Founding requires vision, risk tolerance, recruitment from zero, and the persistence to build something that didn\'t exist before. These are fundamentally different skill sets, and admissions officers know it.\n\nThe psychology of how founding is perceived in admissions is well-documented. Former Yale admissions officer Jeff Brenzel has noted that "founding an organization is one of the clearest signals of genuine leadership we see — it requires every skill we look for: initiative, vision, execution, and the ability to inspire others to join a cause that doesn\'t yet exist."\n\nThis is especially powerful in your context as a first-gen student. You didn\'t have the luxury of joining an established STEM pipeline — there wasn\'t one. So you built it yourself. That narrative resonance amplifies the founding signal considerably.',
                citations: [],
                psychology: 'Admissions committees evaluate leadership through what researchers call the "initiative spectrum" — a mental model that ranks leadership from passive (held a title) to active (created a new entity). Founding sits at the very top of this spectrum because it requires what psychologists call "entrepreneurial agency" — the ability to identify an unmet need and mobilize resources to address it.\n\nThe reason this matters for you specifically: most CS applicants list existing STEM clubs. When an admissions officer sees "founded CS club in underserved school," it creates a cognitive contrast that makes your application memorable. You\'re not one of fifty CS club presidents they\'ll read about this cycle — you\'re a founder.',
                research: 'A 2024 analysis by PrepScholar of successful applicants to top-20 CS programs found that founding an organization was present in 34% of admitted students\' applications, compared to just 12% of rejected applicants with otherwise similar profiles. The "founding premium" in admissions is real and measurable.',
                quote: '"I can teach a student to code. I can\'t teach them to see a gap in their community and build something to fill it. When I see a founder on an application, I see a future builder."',
                quoteSource: 'Professor at Carnegie Mellon School of Computer Science, on admissions criteria',
              },
              howToLeverage: 'Emphasize the creation story, not just the current state. The most compelling way to present this is chronologically: the problem you saw → the decision to act → the challenges you faced → the result you built.\n\nSpecifically, in conversations and essays, anchor your founding story in a concrete moment. When did you first realize your school needed a CS club? Was there a specific event — a classmate who wanted to learn coding but had no outlet, a teacher who mentioned the gap, or your own frustration at the lack of CS resources?\n\nThat anchoring moment transforms "I founded a CS club" from a resume line into a story. And stories are what admissions officers remember.',
              inApplications: 'Use "Founded" as your position title, not "President." This is a small change with outsized impact. When an admissions officer scans your activities list, "Founder & President" immediately communicates initiative, while "President" alone could mean you inherited the role.\n\nIn the Common App position field, write: "Founder & President" (14 characters, well within limits).\n\nIn the description, lead with the founding metrics: "Founded CS club (0→32 members, 2 yrs)" — the 0→32 growth arc is the headline. Then specify the curriculum and events. Finally, anchor the first-gen context: "teaching Python/web dev to first-gen students."\n\nFor the Additional Information section, this connects beautifully to your research: "The CS club grew out of the same frustration that drove my ML research — growing up in a community without STEM resources, I decided to build what was missing."',
            },
          ],
          improvementTeaching: [
            {
              issue: 'Growth metrics not documented',
              whyItMatters: {
                text: 'Without numbers, "grew the club" could mean 5 members or 50. This ambiguity doesn\'t just weaken your description — it actively undermines the founding narrative, because it leaves the reader to guess the scale of your impact.\n\nHere\'s how admissions officers actually read activity descriptions: they scan for anchoring numbers first, then read the qualitative context around them. When there are no numbers, the brain fills in the blanks with averages — and the average school club has about 10-15 members. Your club has 32. That\'s more than double the average, and the reader will never know unless you tell them.\n\nThe specifics that matter most for a founding story are: starting size (ideally zero), ending size, time span, and some measure of programmatic depth (events, curriculum modules, etc.). Each of these numbers tells a different part of the story — starting from zero tells initiative, growth tells impact, and programmatic depth tells quality.',
                citations: [],
                psychology: 'Admissions officers are trained to be skeptical of unquantified claims. When they read "grew the club significantly," a small flag goes up: why didn\'t this student specify the numbers? The absence of quantification is itself a signal — it can suggest either that the numbers aren\'t impressive or that the student doesn\'t have the self-awareness to track their impact.\n\nConversely, when they read "0→32 members in 2 years," the flag goes down. The specificity signals confidence, self-awareness, and a results-oriented mindset. These are the exact qualities that admissions committees are looking for in future campus leaders.',
                research: 'Research from the College Board\'s admission practices survey indicates that "quantified evidence of leadership impact" is rated as "considerably important" by 78% of selective institutions, compared to just 45% for "qualitative descriptions of leadership roles."',
                quote: '"Show me the numbers. Every student says they \'led\' and \'grew\' their organizations. The ones who can tell me exactly how much stand out immediately."',
                quoteSource: 'Former admissions officer, University of Pennsylvania',
              },
              howToFix: 'Document these four key metrics: (1) founding date and starting member count, (2) current active member count, (3) events hosted with approximate attendance, (4) curriculum modules or projects completed.\n\nHere\'s a practical exercise: sit down for 10 minutes and fill in this template:\n- Founded: [month/year], started with [X] members (including yourself)\n- Current: [X] active members, [X] total who\'ve participated\n- Events: [X] hackathons, [X] workshops, [X] guest speakers\n- Curriculum: [X] modules covering [specific topics]\n- Student outcomes: [any concrete results — projects built, competitions entered, college applications]',
              exampleBefore: 'Founded and lead school CS club, teaching coding to students interested in technology',
              exampleAfter: 'Founded CS club (0→32 members, 2 yrs); designed 8-module curriculum teaching Python/web dev to first-gen students; hosted 3 community hackathons',
              transformationAnalysis: 'This transformation is significant. Let\'s break down what changed:\n\nChange 1: "Founded and lead" → "Founded CS club (0→32 members, 2 yrs)"\nThe original tells us you founded something. The revision shows us the trajectory. "0→32 members" is a growth arc compressed into 4 characters — it\'s elegant and immediately communicable. "2 yrs" adds the time dimension, showing sustained commitment.\n\nChange 2: "teaching coding to students" → "designed 8-module curriculum teaching Python/web dev to first-gen students"\nThis upgrade is multi-layered. "Teaching coding" is generic. "Designed 8-module curriculum" shows pedagogical depth — you didn\'t just wing it, you built a structured learning experience. "Python/web dev" specifies the technologies (adding technical credibility). "First-gen students" adds the socioeconomic context that makes this a story about equity, not just CS education.\n\nChange 3: Added "hosted 3 community hackathons"\nThis detail accomplishes two things: it shows event planning capability (a separate skill from teaching), and the word "community" extends the club\'s impact beyond the school walls.\n\nNet effect: The description went from a generic club leadership claim to a quantified founding narrative with clear scope, pedagogy, and community impact. An admissions officer reading this sees: initiative (founded), growth (0→32), depth (8 modules), relevance (Python/web dev), equity (first-gen), and reach (community hackathons). That\'s six signals in 144 characters.',
              priority: 'high',
            },
          ],
          descriptionOptimization: {
            originalDescription: 'Founded and lead school computer science club, teaching coding skills to students interested in technology.',
            optimizedDescription: 'Founded CS club (0→32 members, 2 yrs); designed 8-module curriculum teaching Python/web dev to first-gen students; hosted 3 community hackathons.',
            characterCount: 144,
            changesExplained: [
              { change: 'Added growth metric (0→32)', reason: 'Quantifies founding impact — the zero-to-32 arc is the headline of your founding story' },
              { change: 'Specified curriculum (8 modules, Python/web)', reason: 'Shows depth of educational design — you didn\'t just run meetings, you built a learning experience' },
              { change: 'Added hackathons (3)', reason: 'Shows event organization capability and community engagement beyond regular meetings' },
            ],
            alternativeVersions: [
              'Created CS education program from scratch in underserved school: recruited 32 members, developed Python/web dev curriculum, organized 3 hackathons for 100+ participants.',
              'Founder, school CS club: built 8-module coding curriculum for first-gen students (0→32 members); organized first-ever hackathons connecting students with local tech mentors.',
            ],
          },
          narrativeGuidance: {
            howToTalkAboutThis: { text: 'Tell the founding story — why you saw the need and what you did about it. The first-gen angle makes this uniquely compelling.\n\nThe most powerful way to frame this is as a "gap-filling" narrative: your school didn\'t have CS education, and rather than accepting that limitation, you built the solution yourself. This framing works because it positions you as a problem-solver, not just a participant.\n\nIn conversations and interviews, start with the observation that led to action: "My school didn\'t offer any computer science courses. As someone who\'d taught myself to code, I knew other students were missing out on opportunities they didn\'t even know existed. So I decided to build what our school needed."\n\nThen move to the challenges: finding a faculty advisor, recruiting members who\'d never coded before, designing a curriculum that could take absolute beginners to building real projects. These obstacles make the story interesting.\n\nFinally, land on the impact: 32 members, 8 curriculum modules, 3 hackathons, and students who\'ve gone on to take AP CS at other schools or apply to CS programs.', citations: [] },
            uniqueAngle: 'First-gen student building the CS education infrastructure their school never had',
            connectionToStory: 'This connects directly to your tutoring and research — you\'re building a STEM pipeline. The CS club is the educational arm of your broader mission. It\'s where your research skills meet your teaching instinct, and it creates a narrative of systemic impact rather than individual achievement.',
            interviewTips: ['Describe the moment you decided to found it — anchor it in a specific observation or frustration', 'Share a specific student success story — "One member who\'d never coded before built their first web app and is now applying to CS programs"', 'Explain your curriculum design philosophy — how you structured the 8 modules and why', 'Be ready to discuss what happens after you graduate — have you trained a successor? This shows long-term thinking'],
            essayPotential: { viable: true, angle: 'The moment you realized your school had no CS education and the decision to build it yourself — framing it as a first-gen student creating the access point they never had', cautionAreas: ['Don\'t make it sound like you saved the school — focus on the collaborative building process', 'Avoid listing metrics in an essay — the story matters more than the numbers here', 'Make sure the essay reveals something about YOU, not just the club'] },
          },
          upgradePathway: {
            currentTier: 2,
            targetTier: 1,
            feasibility: 'Medium — Tier 1 for a school club requires either expanding to multiple schools or achieving significant external recognition (district, state, or national level).',
            timeRequired: '6-12 months',
            steps: [
              { step: 1, action: 'Host a district-wide or inter-school hackathon', milestone: 'Event with 50+ participants from multiple schools', timeframe: '2-3 months' },
              { step: 2, action: 'Partner with a local tech company or nonprofit for mentorship', milestone: 'Formal partnership with recognized organization', timeframe: '1-2 months' },
              { step: 3, action: 'Expand curriculum to another school in the district', milestone: 'CS education program running at second school', timeframe: '4-6 months' },
              { step: 4, action: 'Apply for recognition (Congressional Award, Prudential Spirit, etc.)', milestone: 'State or national service award received', timeframe: '6-12 months' },
            ],
            successIndicators: ['Club operating at multiple schools', 'External partnership with recognized tech organization', 'District or state recognition for CS education work', 'Alumni tracking showing college/career outcomes'],
            risks: ['Expanding to other schools requires administrative buy-in that may be slow', 'Time constraints from work and other commitments', 'Award applications are competitive and not guaranteed'],
          },
        },
      },
      {
        activityId: 'farm',
        teachingDepth: 'medium',
        teaching: {
          activityId: 'farm',
          celebration: {
            headline: 'Your farm work isn\'t a disadvantage — it\'s one of your most powerful application assets. In a landscape where many applicants pad their lists with manufactured community service, your family farm obligation is the kind of authentic, sustained responsibility that elite admissions officers specifically look for.',
            strengths: [
              'Authentic obligation that can\'t be fabricated — this is the ultimate authenticity signal. No consultant can put this on a resume, no parent can arrange it, and no student can fake 4 years of daily farm responsibility. Admissions officers at schools like Harvard and Princeton have explicitly stated that genuine family obligations are among the most compelling character indicators they evaluate.',
              'Shows exceptional character and maturity — managing a 40-acre farm while maintaining academic excellence demonstrates time management, responsibility, and grit at a level that most 17-year-olds never experience. You\'re making real economic decisions that affect your family\'s livelihood. That\'s not extracurricular — that\'s life.',
            ],
          },
          tierExplanation: {
            assignedTier: 3,
            explanation: { text: 'Family farm work is categorically Tier 3, but the character signal it sends to admissions officers at elite schools is worth far more than the tier number suggests.', citations: [] },
            benchmarksUsed: [
              { tier: 3, benchmark: 'Family responsibility with sustained commitment', source: 'Sara Harberson framework', studentMeets: true },
            ],
            whatMakesThisTier: { text: 'This is classified Tier 3 by activity type, but elite AOs understand the weight of family obligation.', citations: [] },
            whatWouldChangeIt: { text: 'The tier won\'t change, but framing it as the context for your other achievements multiplies its value.', citations: [] },
          },
          strengthTeaching: [
            {
              strength: 'Authenticity signal',
              whyItMatters: {
                text: 'In a sea of manufactured activities, genuine family obligation stands out. Admissions officers at elite schools know this can\'t be gamed — and they value it accordingly.\n\nHere\'s what most applicants don\'t understand: at highly selective schools, the admissions committee isn\'t just evaluating what you\'ve done. They\'re evaluating who you are. And family obligation is one of the purest signals of character available in an application.\n\nThe admissions psychology here is crucial. When a committee member reads about your farm work alongside your ML research, the research becomes dramatically more impressive. The farm context answers an unspoken question: "Did this student have every advantage, or did they achieve despite constraints?" Your answer is clear — and it\'s powerful.\n\nElite admissions officers have increasingly emphasized the importance of "context" in evaluation. William Fitzsimmons, former dean of admissions at Harvard, has noted that they specifically look for "what students have done with what they\'ve been given." A student who conducts independent research while managing a family farm is operating at a fundamentally different level than a student who does research with a university mentor during their free summer.',
                citations: [],
                psychology: 'The psychological impact of family obligation on an application reader is well-studied. When an admissions officer encounters a genuine family responsibility, it triggers what researchers call "empathic engagement" — a deeper, more personal mode of reading that contrasts with the more detached evaluation mode used for standard activities.\n\nThis empathic engagement means your farm work doesn\'t just add one more line to your activities list — it reframes the entire application. Every achievement is now read through the lens of "this student did this WHILE managing a farm." That contextual reframing is one of the most powerful forces in admissions evaluation.',
                research: 'The Harvard Graduate School of Education\'s "Turning the Tide" report specifically called for admissions offices to "value authentic work obligations, including family responsibilities and paid employment, on par with or above volunteer service activities." This represents a significant shift toward recognizing exactly the kind of real-world responsibility your farm work demonstrates.',
                quote: '"The students who move me most aren\'t the ones with the longest activity lists — they\'re the ones who\'ve shouldered real responsibility and still found ways to pursue their passions. That combination of obligation and aspiration is what resilience looks like."',
                quoteSource: 'Former Stanford admissions officer, in an interview about holistic review',
              },
              howToLeverage: 'Frame as context that elevates everything else you do. The farm isn\'t just another activity — it\'s the backdrop that makes your entire portfolio more compelling.\n\nStrategically, the farm should appear in three places in your application: (1) as an activity on your Common App list with a strong, quantified description, (2) in the Additional Information section where you briefly explain your work/family obligations and how they shape your daily life, and (3) woven into your personal statement or supplemental essays where it naturally connects to your other achievements.\n\nThe key framing technique: never present the farm as a burden or obstacle. Present it as formative context. "Managing our family\'s 40-acre farm taught me to plan, prioritize, and see systems — skills I later applied to my ML research on healthcare systems."',
              inApplications: 'Connect to research motivation in the Additional Information section. Here\'s a suggested framing:\n\n"I manage our family\'s 40-acre farm daily, including seasonal planning, livestock care, and supply logistics. This isn\'t an extracurricular — it\'s been my reality since I was old enough to help. Growing up in a rural agricultural community is also what drove my ML healthcare research: I\'ve seen firsthand how far families here have to drive for basic medical care, and I wanted to use data to map and address those gaps."\n\nThis accomplishes three things: (1) establishes the farm as authentic obligation, (2) quantifies the scope, and (3) connects directly to your research motivation — creating a narrative through-line that\'s impossible to manufacture.',
            },
          ],
          improvementTeaching: [
            {
              issue: 'Described generically',
              whyItMatters: {
                text: 'Generic farm descriptions blend in with thousands of other "helped with family business" entries. Your specific responsibilities and economic decisions are what make this memorable and credible.\n\nThe problem with generic phrasing is that it triggers the admissions officer\'s "standard activity" classification. When they read "help manage family farm operations," they might picture occasional weekend chores. But your reality — daily oversight of a 40-acre operation with livestock, seasonal planning, and supply chain logistics — is vastly different from that assumption.\n\nThe fix is straightforward: replace every generic verb with a specific responsibility, and add at least two quantifying details that convey scale.',
                citations: [],
                psychology: 'When an admissions officer reads a generic farm description, they unconsciously calibrate their impression based on the most common version of that activity. Most "farm work" they encounter in applications is relatively light — weekend or summer help. Without specifics that distinguish your level of involvement, you\'re being evaluated against that default assumption.\n\nAdding specific details (acreage, livestock count, decision-making authority) breaks this default calibration and forces the reader to engage with your actual reality.',
              },
              howToFix: 'Add specific management responsibilities and economic contribution. Focus on three areas:\n\n1. Scale: How big is the farm? How many livestock? What do you grow/produce?\n2. Authority: What decisions do YOU make? Seasonal planning, supply ordering, veterinary scheduling?\n3. Impact: How does your work contribute to the family economy? Are there specific outcomes tied to your management?\n\nThe description should read like a job posting for a farm operations manager — because that\'s what you are.',
              exampleBefore: 'Help manage family farm operations including daily tasks and seasonal planning',
              exampleAfter: 'Co-manage 40-acre family farm: coordinate seasonal planning, oversee livestock care (12 head), manage supply chain logistics contributing to family livelihood',
              transformationAnalysis: 'The transformation here is about moving from passive participation to active management.\n\nChange 1: "Help manage" → "Co-manage"\n"Help" implies subordination. "Co-manage" implies partnership with real authority. This single word change shifts the perceived level of responsibility dramatically.\n\nChange 2: "family farm operations" → "40-acre family farm"\nAdding acreage immediately communicates scale. An admissions officer now has a concrete image of the operation, not an abstract concept.\n\nChange 3: "daily tasks" → "coordinate seasonal planning, oversee livestock care (12 head), manage supply chain logistics"\nThis is the biggest upgrade. "Daily tasks" could mean feeding chickens. The specific responsibilities — seasonal planning, livestock oversight, supply chain logistics — paint a picture of a young person making real management decisions. The "(12 head)" detail adds specificity that signals genuine knowledge of the operation.\n\nChange 4: Added "contributing to family livelihood"\nThis simple phrase elevates the stakes. This isn\'t a hobby farm — it\'s an economic engine for the family. The reader now understands that your management has real financial consequences.',
              priority: 'medium',
            },
          ],
          descriptionOptimization: {
            originalDescription: 'Help manage family farm operations, handling daily tasks and seasonal planning.',
            optimizedDescription: 'Co-manage 40-acre family farm: coordinate seasonal planning, oversee livestock care (12 head), manage supply chain logistics contributing to family livelihood.',
            characterCount: 147,
            changesExplained: [
              { change: 'Added acreage (40-acre)', reason: 'Quantifies scale — transforms abstract "farm" into a concrete operation with measurable scope' },
              { change: 'Specified livestock (12 head)', reason: 'Makes responsibility concrete — shows genuine knowledge and hands-on management' },
              { change: '"Help manage" → "Co-manage"', reason: 'Elevates perceived authority from assistant to partner in management' },
            ],
            alternativeVersions: [
              'Daily operations manager, 40-acre family farm: livestock care (12 head), seasonal crop planning, supply procurement, and financial record-keeping since age 14.',
              'Manage 40-acre family farm alongside academics: oversee livestock health, coordinate seasonal operations, and handle supply chain logistics supporting family income.',
            ],
          },
          narrativeGuidance: {
            howToTalkAboutThis: { text: 'Don\'t apologize for this — and definitely don\'t minimize it. Frame it as the foundation of your work ethic and the real-world context that makes your research meaningful.\n\nThe biggest mistake students with genuine work/family obligations make in applications is treating these experiences as something to explain away rather than something to highlight. Your farm work isn\'t a gap in your resume — it\'s the bedrock of your character story.\n\nWhen discussing the farm in interviews or essays, use this three-part framework:\n\n1. The reality: "I\'ve co-managed our family\'s 40-acre farm since I was 14. That means daily livestock care, seasonal planning, and supply logistics before and after school."\n\n2. The skills: "Running a farm taught me systems thinking long before I learned about computer systems. You have to plan months ahead, adapt to weather and market conditions, and make decisions with real economic consequences."\n\n3. The connection: "That same systems thinking is what drew me to ML research — I was already used to analyzing complex, interconnected variables. The farm just gave me different data to work with."', citations: [] },
            uniqueAngle: 'Rural farm work as the origin story for healthcare research motivation — the healthcare gaps you saw in your farming community directly inspired the ML research',
            connectionToStory: 'Seeing healthcare gaps in your own rural community is what drove the ML research. The farm isn\'t separate from your intellectual journey — it\'s the source of it. Without growing up on a farm in a rural area, you wouldn\'t have witnessed the healthcare access problems that became your research subject.',
            interviewTips: ['Connect farm experience to your research motivation — "Growing up on a farm in a rural area, I saw how far people had to drive just to see a doctor"', 'Emphasize the transferable skills: planning, responsibility, resilience, systems thinking', 'Be specific about your role — don\'t say "I help out," say "I co-manage daily operations including..."', 'If asked about challenges, the farm is a natural answer — talk about balancing farm responsibilities with academics and research'],
            essayPotential: { viable: true, angle: 'The contrast between the physicality of farm work and the abstraction of ML research — how both require the same systems thinking, just applied to different domains', cautionAreas: ['Avoid the "rural hardship" narrative — focus on what you gained, not what you lacked', 'Don\'t romanticize farm work — be honest about the difficulty without being pitiful', 'Make sure the essay connects to your future, not just your past'] },
          },
        },
      },
      {
        activityId: 'grocery',
        teachingDepth: 'medium',
        teaching: {
          activityId: 'grocery',
          celebration: {
            headline: 'Your promotion to shift lead tells a leadership story in just two words. "Promoted to" is one of the most powerful phrases in an activities description because it means someone with real authority evaluated your performance and decided you deserved more responsibility. That\'s external validation that no self-reported claim can match.',
            strengths: [
              'Earned promotion demonstrates real-world leadership recognition — unlike elected club positions where popularity plays a role, your promotion was based purely on performance. A store manager watched you work for 2 years and decided you were ready to lead a team. That\'s the kind of evidence-based leadership assessment that admissions officers trust.',
              'Sustained 3-year commitment while excelling academically — working 20 hours per week for 3 years while maintaining strong academics is an extraordinary demonstration of time management and discipline. This single data point reframes every other achievement on your application: the research, the CS club, the tutoring — you did all of that while working half-time.',
            ],
          },
          tierExplanation: {
            assignedTier: 4,
            explanation: { text: 'Paid employment is Tier 4 by category, but your promotion and hours add weight. More importantly, this contextualizes every other achievement.', citations: [] },
            benchmarksUsed: [
              { tier: 4, benchmark: 'Standard employment', source: 'Sara Harberson framework', studentMeets: true },
            ],
            whatMakesThisTier: { text: 'Employment is categorically Tier 4, but the promotion to management and 3-year commitment add real value.', citations: [] },
            whatWouldChangeIt: { text: 'Focus not on raising the tier but on maximizing how the 20 hrs/week elevates everything else.', citations: [] },
          },
          strengthTeaching: [
            {
              strength: 'Progression narrative',
              whyItMatters: {
                text: 'Admissions officers see the promotion as evidence of real-world leadership capability — not just a resume line. Here\'s why the progression story (bagger → cashier → shift lead) is more powerful than most students realize.\n\nIn the admissions world, there\'s a critical distinction between "positional leadership" (holding a title) and "earned leadership" (receiving authority based on demonstrated competence). Most high school activities involve positional leadership — you run for president, you get elected, you hold the role. Your promotion is earned leadership: someone with real business authority evaluated your performance over 2 years and decided you were ready to manage others.\n\nThis distinction matters because admissions officers are increasingly skeptical of title-heavy applications. They know that many leadership positions are more ceremonial than substantive. But a paid promotion in a competitive work environment? That\'s impossible to game.\n\nThe progression arc also signals sustained growth — you didn\'t start as a manager, you grew into one. That developmental trajectory is exactly what colleges want to see, because it predicts how you\'ll grow during your undergraduate years.',
                citations: [],
                psychology: 'The psychological impact of "promoted to" on an application reader is significant. It triggers what admissions researchers call "third-party validation" — evidence of capability that comes from someone other than the applicant or their references. When a store manager promotes a 17-year-old to lead shifts, that\'s an implicit endorsement of maturity, reliability, and leadership that carries more weight than any recommendation letter could provide.\n\nAdditionally, the 3-year timeline creates a narrative arc that admissions officers find compelling. They can picture the growth: a 14-year-old bagging groceries, learning the business, earning trust, and eventually being entrusted with a team. That story unfolds in their mind automatically — and stories are what make applications memorable.',
                research: 'A 2023 survey of admissions officers at selective institutions found that "sustained paid employment with advancement" was rated as a positive factor by 89% of respondents, with many noting that it provides context that enhances the evaluation of all other activities.',
                quote: '"When I see a student who\'s been promoted at work, I immediately recalibrate my evaluation of everything else on their application. Everything they\'ve accomplished — in school, in activities — they did while working 20 hours a week. That context changes everything."',
                quoteSource: 'Senior admissions reader at a top-20 university',
              },
              howToLeverage: 'Highlight the progression: bagger → cashier → shift lead. The three-step arc is the story. Don\'t just say "shift lead" — say "promoted from entry-level to shift lead over 3 years." The progression communicates growth.\n\nIn your Common App, make sure the position/role field says "Shift Lead (promoted from bagger)" — this immediately signals the advancement without using description characters.\n\nMost importantly, use the Additional Information section to contextualize the hours: "I work 20 hours per week at [store name] to contribute to my family\'s finances. I was promoted to shift lead after 2 years, and now manage a team of 8 during my shifts." This brief note reframes your entire application.',
              inApplications: 'Use the Additional Information section to explain how work obligations shaped your character and created the context for your other achievements.\n\nHere\'s a suggested framing: "While pursuing my research and club activities, I\'ve worked 20 hours per week at [store name] since freshman year. I was promoted to shift lead after two years, now managing a team of 8. This work is essential to my family\'s finances, and balancing it with my academic and extracurricular commitments has taught me rigorous time management and prioritization — skills I apply to everything from farm operations to research methodology."\n\nThis accomplishes three strategic goals: (1) it explains the work hours, (2) it connects the grocery job to the farm obligation for a cumulative "20+ hours of work per week" impact, and (3) it frames the time management as a skill, not a burden.',
            },
          ],
          improvementTeaching: [
            {
              issue: 'Management impact not described',
              whyItMatters: {
                text: 'Without specifics, "shift lead" could mean anything from senior cashier to operations manager. The gap between those interpretations is enormous — and right now, your description leaves the reader to guess.\n\nHere\'s the problem: most admissions officers haven\'t worked in grocery retail. They don\'t know what a shift lead does unless you tell them. If you write "manage operations," they might picture you restocking shelves. But if you write "manage team of 8, train new hires, oversee $15K daily inventory flow," they picture a young operations manager with real authority.\n\nThe specifics serve a dual purpose: they communicate the actual scope of your responsibilities AND they demonstrate the self-awareness to articulate your impact. Both are valuable signals.',
                citations: [],
                psychology: 'When an admissions officer encounters an ambiguous work description, they default to the most common interpretation — which is usually a more modest version of reality. By leaving your management scope vague, you\'re allowing the reader to undervalue your role.\n\nSpecific management details combat this "default to modest" bias by forcing the reader to engage with your actual responsibilities. "Team of 8" is concrete enough to prevent underestimation.',
              },
              howToFix: 'Add team size, training responsibilities, and operational scope. Here\'s the formula:\n\n[Promotion trajectory] + [team size] + [specific responsibilities] + [context of hours/academics]\n\nThe ideal description covers: how you got the role (promotion), who you manage (team size), what you\'re responsible for (operations/training/inventory), and the broader context (GPA with 20 hrs/wk).\n\nAvoid generic management language like "oversee operations." Instead, use specific verbs: "manage," "train," "oversee," "schedule." Each verb should have a corresponding number or scope.',
              exampleBefore: 'Work as shift lead at grocery store, managing daily operations and training new employees',
              exampleAfter: 'Promoted to shift lead after 2 yrs; manage team of 8, train new hires, oversee $15K daily inventory flow while maintaining 3.8 GPA with 20 hrs/wk',
              transformationAnalysis: 'This transformation packs maximum information into 149 characters. Let\'s break down each change:\n\nChange 1: "Work as shift lead" → "Promoted to shift lead after 2 yrs"\nThe original states a position. The revision tells a story. "Promoted after 2 yrs" communicates earned advancement and sustained commitment in 5 words.\n\nChange 2: "managing daily operations" → "manage team of 8"\nThis specificity upgrade is critical. "Daily operations" is a catch-all that could mean anything. "Team of 8" gives the reader a concrete picture of management scope. Numbers create anchors for evaluation.\n\nChange 3: "training new employees" → "train new hires, oversee $15K daily inventory flow"\nAdding the inventory dollar amount ($15K daily) transforms the role from "retail worker" to "operations manager." The dollar figure communicates trust and responsibility in business terms that admissions officers — many of whom have business backgrounds — immediately understand.\n\nChange 4: Added "while maintaining 3.8 GPA with 20 hrs/wk"\nThis is the most strategically important addition. It contextualizes the job within the broader academic picture. Now the reader doesn\'t just see a shift lead — they see a student achieving a 3.8 GPA while working half-time. Every other achievement on the application is now more impressive.',
              priority: 'medium',
            },
          ],
          descriptionOptimization: {
            originalDescription: 'Work as shift lead at grocery store, managing daily operations and training new employees.',
            optimizedDescription: 'Promoted to shift lead after 2 yrs; manage team of 8, train new hires, oversee $15K daily inventory flow while maintaining 3.8 GPA with 20 hrs/wk.',
            characterCount: 149,
            changesExplained: [
              { change: 'Added promotion timeline (2 yrs)', reason: 'Shows progression — "promoted after 2 years" is a story, not just a title' },
              { change: 'Added team size (8) and inventory ($15K)', reason: 'Quantifies management scope — transforms "retail work" into "operations management"' },
              { change: 'Added academic context (3.8 GPA, 20 hrs/wk)', reason: 'Contextualizes every other achievement — this is the single most impactful detail' },
            ],
            alternativeVersions: [
              'Shift lead (promoted yr 2): supervise 8-person team, conduct new hire training, manage $15K nightly inventory — 20 hrs/wk while maintaining honors GPA.',
              'Bagger→cashier→shift lead (3 yrs): lead team of 8, train staff, manage inventory operations. Work 20 hrs/wk supporting family alongside full AP courseload.',
            ],
          },
          narrativeGuidance: {
            howToTalkAboutThis: { text: 'This is a character signal, not just a job. Frame the hours as context that makes your academic achievements exceptional.\n\nThe grocery job serves a specific strategic function in your application: it\'s the "multiplier." Every other achievement you list — the research, the CS club, the tutoring, the farm — becomes more impressive when the reader knows you did it all while working 20 hours per week.\n\nIn conversations and interviews, don\'t lead with the grocery job. Instead, mention it naturally when discussing your schedule or time management: "Between the farm, my shifts at [store name], and my research, I\'ve learned that there\'s always more time if you\'re intentional about how you use it."\n\nThe key is to present the work not as a complaint but as a formative experience. The promotion story (bagger → cashier → shift lead) demonstrates growth. The management responsibilities demonstrate leadership. The hours demonstrate character. Together, they create a portrait of a mature, responsible young person that few 17-year-olds can match.', citations: [] },
            uniqueAngle: '20 hours/week of paid work as the backdrop for academic excellence and independent research',
            connectionToStory: 'Working while studying gives your research and CS club achievements a "despite the odds" quality that makes the entire portfolio more compelling. The grocery job is the silent context behind every accomplishment.',
            interviewTips: ['Mention the progression story naturally — don\'t force it, but have it ready when they ask about work experience', 'Connect management skills to club leadership — "Managing a shift team taught me to delegate and communicate, which I apply to running the CS club"', 'If asked about work-life balance, be honest but positive — "It\'s demanding, but it\'s taught me skills I couldn\'t learn in a classroom"', 'Have a specific anecdote ready — a challenging shift, a training moment, a problem you solved'],
          },
        },
      },
    ],
    quickEncouragements: [
      {
        activityId: 'tutoring',
        celebration: 'Your STEM tutoring program is a beautiful extension of your CS mission — you\'re building the pipeline you never had. This activity perfectly reinforces your broader narrative of creating access and teaching what you\'ve learned. It\'s the "paying it forward" chapter of your story.',
        strengthReason: 'Authentic service activity that reinforces your core narrative of CS education access. The tutoring isn\'t a standalone service project — it\'s the direct application of your teaching instinct. Combined with the CS club, it shows a pattern: you don\'t just learn, you teach. That\'s a powerful identity for a college application.',
        quickTip: 'Track 2-3 specific student success stories. "Helped 25 students" is good; "tutored Maya from a D to a B+ in physics over one semester" is unforgettable. Specific stories are what admissions officers remember — they\'re the proof that your teaching actually works.',
      },
    ],
    skippedActivities: [],
    portfolioTeaching: {
      narrativeTeaching: {
        currentState: 'Your portfolio tells a compelling story of a first-gen student building technology infrastructure for their community, but the descriptions don\'t yet do the story justice.',
        recommendation: 'Invest 30 minutes quantifying each description. This single action could raise your overall presentation score by 2+ points.',
        twoSentencePitch: 'This student doesn\'t just study CS — they deploy it where it matters. From ML healthcare research to founding a CS club, they\'re building the tech infrastructure their community never had.',
      },
      coherenceTeaching: {
        currentScore: 78,
        improvements: ['Connect farm work explicitly to research motivation', 'Reference tutoring outcomes in CS club narrative'],
      },
      strategicDirection: 'Your strongest move is securing that research publication. It would push research toward Tier 1 and elevate the entire portfolio narrative.',
    },
    scoringTeaching: {
      activityTransformations: [
        {
          activityId: 'research',
          currentScore: 6.2,
          revisionLevel: 'moderate_revision',
          principle: {
            name: 'The Specificity Multiplier',
            whyItMatters: 'Research shows that specific, quantified claims are perceived as 2-3x more credible than qualitative ones in admissions contexts. Your research description is strong in concept but relies on qualitative claims that could apply to many applicants. Adding precise metrics transforms a good description into an unforgettable one.\n\nThe underlying principle is what admissions researchers call "concreteness advantage" — the cognitive phenomenon where specific numbers create stronger memory traces and higher credibility ratings than abstract claims. When an admissions officer reads "87% accuracy" rather than "effective model," they form a fundamentally different impression of your capability.',
            applicationToActivity: 'Your ML healthcare research is impressive regardless of phrasing, but the current description doesn\'t convey the full scope. Adding accuracy metrics, dataset scale, and population impact numbers will ensure that a 6-second scan captures the true significance of your work.\n\nSpecifically: model performance (87% accuracy), dataset scope (12 healthcare systems), and human impact (15,000+ affected residents) are the three numbers that transform this from "student did ML project" to "student produced measurable research impact on their community."',
          },
          rewrite: {
            original: 'Developed machine learning model to analyze healthcare access gaps in rural communities. Submitted paper to regional conference.',
            suggested: 'Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents; paper submitted to IEEE regional conference.',
            characterCount: 148,
            changesApplied: [
              { element: 'Technology specification', original: 'machine learning model', transformed: 'NLP model (87% accuracy)', rationale: 'Specifying NLP + accuracy metric transforms generic tech claim into verifiable achievement' },
              { element: 'Scope quantification', original: 'healthcare access gaps in rural communities', transformed: '12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents', rationale: 'Three concrete numbers (12, 3, 15000+) create anchors for evaluating scale and impact' },
              { element: 'Venue specification', original: 'regional conference', transformed: 'IEEE regional conference', rationale: 'Named venue adds institutional credibility and signals peer review standards' },
            ],
          },
          alternatives: [
            { angle: 'Technical depth focus', rewrite: 'Built NLP pipeline for unstructured health data (87% F1 score); analyzed 12 county health systems, mapping 3 critical care deserts. IEEE conference submission.', whenToUse: 'When applying to highly technical CS programs (MIT, CMU) where methodology detail matters more than human impact' },
            { angle: 'Community impact focus', rewrite: 'Used ML to map healthcare access for 15,000+ rural residents across 12 systems; identified 3 critical service gaps now informing county health planning. IEEE paper.', whenToUse: 'When applying to schools emphasizing social impact (Stanford, Princeton) where the "why" matters more than the "how"' },
          ],
          citations: [
            { source: 'turning_the_tide', sourceName: 'Harvard GSE: Turning the Tide', insight: 'Selective colleges should value authentic intellectual engagement and contributions to community, prioritizing quality over quantity in activities.', application: 'Your research is the archetype of what this report envisions — genuine intellectual work addressing a real community need.' },
            { source: 'nacac_2024', sourceName: 'NACAC State of Admission 2024', insight: 'Among applications with similar activity profiles, those with quantified descriptions received "strong" ratings 67% more often.', application: 'Adding 3 specific metrics to your description could shift the reader\'s initial categorization from "strong" to "exceptional."' },
          ],
          expectedScoreImprovement: {
            projectedScore: 8.5,
            improvingComponents: ['quantification (+2.0)', 'specificity (+1.0)', 'impactClarity (+1.5)'],
            rationale: 'The revised description addresses the three weakest scoring dimensions (quantification, specificity, impact clarity) simultaneously. The addition of model accuracy, dataset scale, and population impact metrics should elevate these components from the 4-6 range to the 7-9 range, pushing the overall description score from 6.2 to approximately 8.5.',
          },
        },
        {
          activityId: 'cs-club',
          currentScore: 5.8,
          revisionLevel: 'moderate_revision',
          principle: {
            name: 'The Growth Arc Principle',
            whyItMatters: 'Founding organizations is inherently impressive, but the most compelling founding stories include measurable growth trajectories. "I started a club" is good; "I grew an organization from 0 to 32 members while building an 8-module curriculum" is unforgettable.\n\nThe growth arc principle is based on the psychological concept of "trajectory thinking" — humans are naturally drawn to stories of progression and development. A founding story WITH growth metrics activates this trajectory thinking in the reader, making your achievement feel dynamic rather than static.',
            applicationToActivity: 'Your CS club founding story has all the right elements — initiative, educational mission, first-gen context — but the current description presents it as a static fact rather than a dynamic growth story. Adding the 0→32 trajectory, curriculum depth, and event count transforms a founding claim into a measurable scaling achievement.',
          },
          rewrite: {
            original: 'Founded and lead school computer science club, teaching coding skills to students interested in technology.',
            suggested: 'Founded CS club (0→32 members, 2 yrs); designed 8-module curriculum teaching Python/web dev to first-gen students; hosted 3 community hackathons.',
            characterCount: 144,
            changesApplied: [
              { element: 'Growth trajectory', original: 'Founded and lead', transformed: 'Founded CS club (0→32 members, 2 yrs)', rationale: 'Zero-to-32 arc communicates both founding AND growth in minimal characters' },
              { element: 'Curriculum depth', original: 'teaching coding skills', transformed: 'designed 8-module curriculum teaching Python/web dev', rationale: 'Shows pedagogical depth and specific technology stack' },
              { element: 'Community reach', original: '(not mentioned)', transformed: 'hosted 3 community hackathons', rationale: 'Extends impact beyond the school and shows event organization capability' },
            ],
          },
          alternatives: [
            { angle: 'Educational access focus', rewrite: 'Created CS education program from scratch in underserved school: recruited 32 members, developed Python/web dev curriculum, organized 3 hackathons for 100+ participants.', whenToUse: 'When applying to schools that emphasize equity and access (many Ivies, Stanford, MIT)' },
            { angle: 'Entrepreneurial framing', rewrite: 'Founder, school CS club: built 8-module coding curriculum, grew 0→32 members, organized 3 hackathons connecting students with local tech mentors. First-gen CS pipeline.', whenToUse: 'When applying to schools with entrepreneurship programs (Wharton, Babson) or where "builder" identity is valued' },
          ],
          citations: [
            { source: 'yale_admissions', sourceName: 'Yale Admissions Blog', insight: 'We look for students who have founded organizations or initiated projects, as this demonstrates the kind of proactive leadership we value in our community.', application: 'Your founding story directly addresses this evaluation criterion — make sure the description conveys the full scope of what you built.' },
          ],
          expectedScoreImprovement: {
            projectedScore: 8.0,
            improvingComponents: ['quantification (+2.0)', 'specificity (+1.5)', 'impactClarity (+1.0)'],
            rationale: 'Adding growth metrics (0→32), curriculum specifics (8 modules, Python/web dev), and event count (3 hackathons) addresses all three weak dimensions simultaneously. The first-gen student context adds authenticity that the original description lacked.',
          },
        },
      ],
    },
    qualityMetrics: {
      celebrationFirst: true,
      citationsIncluded: 0,
      examplesIncluded: 5,
      averageDepth: 7.5,
    },
    teachingMetadata: {
      generatedAt: '2026-02-20T12:02:00Z',
      modelUsed: 'claude-sonnet-4-5-20250929',
      tokensUsed: { input: 6000, output: 9500 },
      cost: 0.18,
      activitiesTaught: 4,
      activitiesSkipped: 0,
    },
  },

  // ==========================================================================
  // STAGE 3: Synthesis Context
  // ==========================================================================
  stage3: {
    finalAssessment: {
      harvardScale: 3,
      harvardScaleRationale: 'Two Tier 2 activities with strong coherence and authentic first-gen context place this portfolio in the "Good" range. Publication would push toward Outstanding.',
      overallStrength: 'competitive',
      confidence: 78,
    },
    orderedActivities: [
      { rank: 1, activityId: 'research', reason: 'Strongest differentiator — original ML research, Tier 2', finalDescription: 'Developed NLP model (87% accuracy) analyzing 12 rural healthcare systems, identifying 3 critical service gaps affecting 15,000+ residents; paper submitted to IEEE regional conference.', characterCount: 148 },
      { rank: 2, activityId: 'cs-club', reason: 'Shows initiative and educational leadership', finalDescription: 'Founded CS club (0→32 members, 2 yrs); designed 8-module curriculum teaching Python/web dev to first-gen students; hosted 3 community hackathons.', characterCount: 144 },
      { rank: 3, activityId: 'farm', reason: 'Most compelling first-gen story', finalDescription: 'Co-manage 40-acre family farm: coordinate seasonal planning, oversee livestock care (12 head), manage supply chain logistics contributing to family livelihood.', characterCount: 147 },
      { rank: 4, activityId: 'grocery', reason: 'Work ethic, earned promotion', finalDescription: 'Promoted to shift lead after 2 yrs; manage team of 8, train new hires, oversee $15K daily inventory flow while maintaining 3.8 GPA with 20 hrs/wk.', characterCount: 149 },
      { rank: 5, activityId: 'tutoring', reason: 'Reinforces teaching theme', finalDescription: 'Lead weekly STEM tutoring sessions for 25+ underserved students across math, physics, and CS; designed practice problems aligned to AP curriculum.', characterCount: 146 },
    ],
    actionPlan: {
      immediate: [
        { action: 'Quantify ML research impact — model accuracy, dataset size, patient outcomes affected', impact: 'Elevates research from "impressive" to "measurable"' },
        { action: 'Document CS Club growth metrics — members, events, curriculum modules created', impact: 'Strengthens leadership narrative with concrete numbers' },
      ],
      shortTerm: [
        { action: 'Follow up on research paper submission status', impact: 'Publication would push toward Tier 1', deadline: '3 months' },
        { action: 'Identify and document 3 specific student success stories from tutoring', impact: 'Transforms tutoring from generic to compelling' },
      ],
      longTerm: [
        { action: 'Develop capstone narrative connecting CS research to rural healthcare mission', impact: 'Creates unforgettable application story' },
        { action: 'Explore REU programs to deepen research credentials', impact: 'Could elevate to Harvard Scale 2' },
      ],
    },
    finalMessage: {
      celebration: 'You\'re doing something remarkable — building real technology for your community while shouldering responsibilities most applicants never face.',
      keyTakeaway: 'Your biggest opportunity isn\'t adding new activities — it\'s telling the story of what you already do with the specificity it deserves.',
      closing: 'The quantification work is the fastest path to a stronger application. 30 minutes of adding numbers to your descriptions could change how admissions officers see your entire portfolio.',
    },
    scoringSummary: {
      overallScore: 7.2,
      harvardScale: 3,
      averageActivityScore: 7.4,
      averageDescriptionScore: 5.8,
      rankedActivities: [
        { activityId: 'research', combinedScore: 8.1, rank: 1 },
        { activityId: 'cs-club', combinedScore: 7.8, rank: 2 },
        { activityId: 'tutoring', combinedScore: 7.0, rank: 3 },
        { activityId: 'farm', combinedScore: 6.9, rank: 4 },
        { activityId: 'grocery', combinedScore: 6.2, rank: 5 },
      ],
    },
    pipelineCost: { stage0: 0.02, stage1: 0.12, stage2: 0.18, stage3: 0.08, total: 0.40 },
    synthesisMetadata: {
      generatedAt: '2026-02-20T12:04:00Z',
      modelUsed: 'claude-haiku-4-5-20251001',
      tokensUsed: { input: 3500, output: 4200 },
      cost: 0.08,
    },
  },

  // ==========================================================================
  // LEGACY COMPATIBILITY FIELDS
  // ==========================================================================
  analysis: stage1Data,

  teaching: {
    activities: {},
    narrativeTeaching: {
      twoSentencePitch: 'This student doesn\'t just study CS — they deploy it where it matters. From ML healthcare research to founding a CS club, they\'re building the tech infrastructure their community never had.',
      extendedPitch: 'A first-gen student who taught themselves ML while working 20 hours/week, then applied that knowledge to address real healthcare gaps in their rural community.',
      archetype: 'stem',
      archetypeExplanation: { text: 'STEM innovator with community impact focus.', citations: [] },
      howToPresent: { text: 'Lead with research, support with founding story, contextualize with work obligations.', citations: [] },
      narrativeStrengths: ['Authentic first-gen narrative', 'Research with community impact'],
      narrativeWeaknesses: ['Descriptions under-quantified'],
    },
    spikeTeaching: {
      currentState: { text: 'Emerging CS/tech spike visible through 3 connected activities.', citations: [] },
      whatMakesASpike: { text: 'A spike requires depth AND external validation in a focused area.', citations: [] },
      studentSpikeAssessment: { text: 'Your spike is emerging but needs publication or competition results to mature.', citations: [] },
    },
    coherenceTeaching: {
      currentCoherence: { text: 'Strong thematic coherence at 78/100.', citations: [] },
      whatMakesCoherence: { text: 'Activities that tell a unified story about who you are.', citations: [] },
      connectingActivities: [],
      addressingDisconnects: [],
      strengtheningStrategies: [],
    },
    commonAppStrategy: {
      recommendedOrder: ['research', 'cs-club', 'farm', 'grocery', 'tutoring'],
      orderRationale: { text: 'Lead with strongest differentiator, follow with founding story.', citations: [] },
      whatToHighlight: [],
      whatToMinimize: [],
      overallPositioning: { text: 'Position as a builder and researcher, not just a student.', citations: [] },
      characterCountStrategy: 'Maximize every character — use the optimized descriptions provided.',
    },
    gapFillingGuidance: [],
    strategicRecommendations: {
      immediate: [{ text: 'Quantify all activity descriptions.', citations: [] }],
      shortTerm: [{ text: 'Follow up on research publication.', citations: [] }],
      longTerm: [{ text: 'Explore REU programs.', citations: [] }],
      activitiesToStop: [],
      activitiesToDeepen: [{ activityId: 'research', howToDeepen: 'Pursue publication', expectedOutcome: 'Tier 1 achievement' }],
      newActivitiesToConsider: [],
    },
  },

  // ==========================================================================
  // FINAL NARRATIVE
  // ==========================================================================
  finalNarrative: {
    story: {
      pitch: 'This student taught themselves machine learning while stocking shelves at night, then used NLP to analyze healthcare gaps in their own rural community — turning a 20-hour work week and family farm obligations into the foundation for research that matters.',
      uniqueAngle: 'The intersection of paid labor, family obligation, and cutting-edge CS research creates a profile that is impossible to replicate',
      whyItMatters: 'This student represents the kind of resilient, resourceful problem-solver that creates real impact — they don\'t wait for resources, they build them.',
      emergentTraits: ['resourcefulness', 'intellectual curiosity', 'community responsibility'],
    },
    threads: [
      { name: 'Technology as Community Infrastructure', activityIds: ['cs-club', 'research', 'tutoring'], manifestation: 'Building CS knowledge and distributing it through education', admissionsValue: 'Shows sustained commitment to using tech for social good', synergy: 'Each activity builds on the others — research produces knowledge, CS club distributes it, tutoring applies it directly' },
      { name: 'Responsibility-Driven Excellence', activityIds: ['grocery', 'farm', 'research'], manifestation: 'Achieving despite real economic constraints', admissionsValue: 'Demonstrates character depth that elite AOs value', synergy: 'Work obligations don\'t compete with academics — they fuel the motivation and provide real-world context' },
      { name: 'First-Generation STEM Pipeline', activityIds: ['cs-club', 'tutoring', 'research'], manifestation: 'Creating access for others like them', admissionsValue: 'Shows awareness of systemic gaps and initiative to address them', synergy: 'Creating the support system this student never had, for others like them' },
    ],
    elevations: [
      { elevatedActivityId: 'research', elevatingActivityId: 'grocery', mechanism: '3,120 hours of paid work transforms the research from "impressive" to "extraordinary" — this student earned every hour of research time', combinedImpression: 'A student who works 20 hours/week AND conducts original research', strength: 'transformative' },
      { elevatedActivityId: 'research', elevatingActivityId: 'farm', mechanism: 'Rural farm context gives the healthcare research personal stakes and authentic motivation', combinedImpression: 'Research driven by lived experience, not resume padding', strength: 'strong' },
    ],
    spike: {
      primarySpike: { area: 'Computer Science & Educational Leadership', activities: ['research', 'cs-club', 'tutoring'], depth: 'Emerging spike with research anchor', distinctiveness: 'Self-taught ML applied to community healthcare is highly distinctive' },
      supportingElements: [
        { activityId: 'tutoring', howItSupports: 'Extends CS expertise into educational impact', elevationEffect: 'Shows the student doesn\'t just learn — they teach' },
      ],
      complementaryBreadth: [
        { area: 'Work & Family Responsibility', activities: ['grocery', 'farm'], whyItMatters: 'Provides authentic character depth and contextualizes all achievements' },
      ],
    },
    gaps: [
      { gap: 'No Tier 1 national recognition', existingMitigation: 'Research paper submission is close', positiveFraming: 'Publication in progress — trajectory matters more than current status', addressableThroughDescription: false },
    ],
    coherence: {
      score: 78,
      assessment: 'strong',
      unifyingElement: 'Technology as a tool for community impact, built by someone who understands need firsthand',
      outliers: [],
    },
    positioning: {
      strengths: ['Authentic first-gen narrative', 'Independent research capability', 'Founding leadership'],
      differentiators: ['ML research addressing own community healthcare gaps', 'Founded CS education infrastructure in underserved school'],
      memorableElement: 'The image of a student stocking shelves at night and training ML models during the day',
      schoolFit: ['Research universities', 'Schools valuing socioeconomic diversity', 'STEM-focused institutions'],
    },
    metadata: {
      generatedAt: '2026-02-20T12:03:00Z',
      modelUsed: 'claude-sonnet-4-5-20250929',
      tokensUsed: { input: 5000, output: 6000 },
      cost: 0.10,
      analysisType: 'initial',
    },
  },

  // ==========================================================================
  // SCORING
  // ==========================================================================
  scoring: {
    portfolioRubric: portfolioRubricData,
    activityScores: activityScoresData,
  },

  // ==========================================================================
  // TEACHING SUMMARY
  // ==========================================================================
  teachingSummary: {
    currentState: 'Your portfolio has strong bones — two Tier 2 anchors, authentic first-gen context, and a visible CS spike. But your descriptions are leaving impact on the table.',
    strategicDirection: 'Invest in quantification across all descriptions, then pursue research publication. These two moves could push you from Harvard Scale 3 to 2.',
    twoSentencePitch: 'This student doesn\'t just study CS — they deploy it where it matters. From ML healthcare research to founding a CS club, they\'re building the tech infrastructure their community never had.',
  },

  totalCost: 0.40,
};
