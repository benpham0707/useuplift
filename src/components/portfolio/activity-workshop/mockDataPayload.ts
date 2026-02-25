// @ts-nocheck
/**
 * Mock data payload for the Activity Workshop frontend.
 *
 * Split from mockData.ts for code-splitting / dynamic import.
 * Contains the large MOCK_DATA constant and its supporting data structures.
 */

import type { ActivityWorkshopPipelineResult } from '../../../services/portfolioStrategy/services/activityWorkshop/types';

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
        specificity: { score: 6, maxScore: 10, weight: 0.25, rationale: 'The research topic (ML for healthcare access) is clear and distinctive, but your individual contribution to the project could be sharper. Currently, a reader can\'t tell whether you built the entire pipeline yourself or assisted on a larger team. Since this is fully independent work, the description should make that unmistakably clear.' },
        impactClarity: { score: 5, maxScore: 10, weight: 0.25, rationale: 'Outcomes are mentioned ("analyze healthcare access gaps") but not quantified. Without accuracy metrics, dataset size, or specific findings, the reader is left to guess the scale and rigor of your work. A 5 is solidly average — adding 2-3 numbers would push this to 8+.' },
        actionLanguage: { score: 7, maxScore: 10, weight: 0.15, rationale: 'Strong verbs like "developed" and "analyzed" convey genuine agency — you\'re doing the work, not assisting or observing. This is one of the description\'s strongest elements. To reach 9+, consider even more precise verbs: "engineered," "designed," "validated."' },
        quantification: { score: 4, maxScore: 10, weight: 0.15, rationale: 'This is the biggest gap. Missing key numbers that would transform the description: model accuracy (87%), dataset size (12 healthcare systems), communities served (15,000+ residents). The quantification score is the single most improvable dimension — fixing this alone could raise the overall description score by 1.5+ points.' },
        authenticityVoice: { score: 7, maxScore: 10, weight: 0.20, rationale: 'The rural healthcare angle is distinctive and clearly personal — this isn\'t a topic chosen for strategic reasons, it comes from lived experience. The authenticity signal is strong. To reach 9+, make the personal connection even more explicit in the description.' },
      },
      strengths: ['Clear research topic', 'Personal connection to rural healthcare'],
      improvements: ['Quantify ML model accuracy', 'Add dataset size and scope metrics'],
      overallRationale: 'The description conveys an impressive research project but relies too heavily on qualitative claims. Adding 2-3 specific metrics would elevate this from a 6 to an 8+.',
      suggestedRewrite: 'Built Python/pandas pipeline processing 50K patient records for NLP healthcare access analysis; co-authored paper under review, J. Health Informatics.',
    },
    activityScore: {
      total: 8.2,
      breakdown: {
        tierAssessment: { score: 8, maxScore: 10, weight: 0.343, weightedScore: 2.744, rationale: 'Independent ML research on a genuine community healthcare problem places this solidly in Tier 2. For context: fewer than 3% of high school students conduct original research outside a lab setting, and even fewer choose topics rooted in their own community\'s needs. Tier 2 activities are characterized by "significant achievement requiring sustained commitment and producing measurable impact beyond the school community." Your work meets every criterion. The gap to Tier 1 is narrow — publication in a peer-reviewed journal or presentation at a national symposium (Regeneron STS, JSHS) would close it. Note: The contextual analysis (which factors in first-gen status and self-taught background) reinforces the Tier 2 placement, as the degree of self-direction is exceptional given available resources.', tier: 2 },
        recognitionLevel: { score: 7.5, maxScore: 10, weight: 0.286, weightedScore: 2.145, rationale: 'Paper submitted to IEEE regional conference — this is significant because it subjects your work to academic peer review standards. Most high school research never reaches the submission stage. A 7.5 reflects that submission itself is a strong signal of scholarly intent, but publication would push this to 9+. Compare: state Science Olympiad medalists (7-8 range), published journal authors (9-10 range). Your submission puts you above the median for high school researchers but below the threshold for national recognition.', level: 'regional' },
        leadershipImpact: { score: 0, maxScore: 10, weight: 0.0, weightedScore: 0.0, rationale: 'Not applicable — this is individual research without a team leadership component. The weight for this dimension has been redistributed to other factors (tier assessment and commitment). This is not a penalty; many of the strongest Tier 1-2 activities are individual pursuits. The scoring model correctly identifies that leadership metrics don\'t apply to solo research and zeroes out the weight rather than penalizing you.', isApplicable: false, role: 'independent', impactScope: 'individual' },
        communityCharacter: { score: 9, maxScore: 10, weight: 0.171, weightedScore: 1.539, rationale: 'This is one of your strongest dimensions. Your research directly addresses healthcare access gaps in your own rural community — this isn\'t a topic chosen for strategic admissions positioning, it comes from lived experience growing up on a farm where the nearest hospital was over an hour away. Admissions officers are trained to distinguish between "resume padding" research and authentic intellectual engagement; your project reads as genuinely motivated. The 9/10 reflects both the depth of community connection and the authenticity signal. To reach 10, the description would need to explicitly name a specific outcome that benefited real community members.', primaryTrait: 'curiosity', communityBenefit: 'significant', authenticitySignal: 'highly_authentic' },
        commitmentProgression: { score: 9, maxScore: 10, weight: 0.20, weightedScore: 1.80, rationale: '1.5 years of sustained research with clear progression: you moved from initial data collection and literature review, to building the NLP pipeline, to model validation, to paper submission. This trajectory demonstrates exactly the kind of intellectual persistence that research universities look for. The progression is particularly impressive because it was entirely self-directed — no lab mentor, no structured program. Compare to typical high school research timelines: most school-year projects last 3-6 months; summer REU programs are 8-10 weeks. Your 1.5-year arc puts you well above average for sustained commitment.', years: 1.5, showsProgression: true, sustainedThroughJunior: true },
        weightConfig: { tierWeight: 0.343, recognitionWeight: 0.286, leadershipWeight: 0.0, communityWeight: 0.171, commitmentWeight: 0.20, leadershipApplicable: false },
      },
      tierJustification: 'Original ML research addressing a real community need. Self-directed methodology, paper submission, and community impact place this at high Tier 2.',
      comparisonBenchmarks: { similarTo: 'Independent research published in regional STEM journal', above: 'NSF-funded lab research with national conference presentation', below: 'Science fair project without external validation' },
      improvementPaths: ['Secure publication in peer-reviewed journal', 'Present at national conference', 'Expand to multi-county dataset'],
      overallRationale: 'Exceptional self-directed research with authentic community motivation. Publication would push toward Tier 1.',
    },
    combinedScore: { total: 7.6, formula: '(8.2 × 0.7) + (6.2 × 0.3)', rationale: 'Strong activity held back slightly by under-quantified description' },
    summary: { oneLiner: 'Impressive self-directed ML research with authentic community impact', topStrength: 'Original research methodology with real-world healthcare application', topImprovement: 'Quantify model performance metrics in description' },
  },
  {
    activityId: 'cs-club',
    activityTitle: 'CS Club Founder & President',
    descriptionScore: {
      total: 5.8,
      breakdown: {
        specificity: { score: 5, maxScore: 10, weight: 0.25, rationale: 'The founding story is clear — you started this club from scratch — but your day-to-day role blurs with generic club president language. A reader can\'t tell what you specifically do vs. what any club president does. "Organized meetings" and "led sessions" are true but generic. What makes YOUR presidency unique? Did you write the curriculum yourself? Do you personally mentor beginners? Did you design the hackathon format? The description needs to make your individual fingerprint unmistakable. Right now, if you swapped "CS Club" for "Math Club" or "Debate Club," much of the description would still read the same — and that\'s a red flag for specificity.' },
        impactClarity: { score: 6, maxScore: 10, weight: 0.25, rationale: 'You mention growth and impact but rely on qualitative claims rather than evidence. "Grew the club" — from what to what? "Hosted a hackathon" — how many participants? How many had never coded before? What happened afterward? A 6 is above average because the founding narrative itself implies impact, but you\'re leaving the reader to guess the scale. Compare to a 9-scoring description: "Grew membership from 4 founding members to 35 active participants; 60% had no prior coding experience. Organized school\'s first hackathon (60 participants, 12 projects), with 3 teams continuing development post-event." Numbers transform claims into evidence.' },
        actionLanguage: { score: 6, maxScore: 10, weight: 0.15, rationale: 'The verbs are adequate but not as precise as they could be. "Founded" is strong — keep it. But "organized," "led," and "managed" are generic leadership verbs that appear in thousands of club descriptions. For a founder, you want verbs that convey creation and vision: "designed" (the curriculum), "recruited" (founding members), "launched" (the hackathon series), "built" (the mentorship pipeline). Each verb should make the reader think "only the founder would say this." To reach 8+, replace every generic verb with one that could only describe YOUR specific contribution.' },
        quantification: { score: 5, maxScore: 10, weight: 0.15, rationale: 'This is your biggest missed opportunity. Key numbers that are missing: founding members vs. current members (4 → 35), meetings per year (40+), curriculum modules created (8), hackathon participants (60), percentage of members with no prior CS experience (60%), members who subsequently enrolled in AP CS (12). Any 2-3 of these numbers would push this score to 8+. The quantification score is the single most improvable dimension — the data exists, it just isn\'t in the description yet.' },
        authenticityVoice: { score: 7, maxScore: 10, weight: 0.20, rationale: 'The first-gen student creating CS access angle is inherently distinctive and personal. An admissions officer reading this immediately understands the "why" — you\'re not founding a club because it looks good, you\'re building something you wished had existed when you were starting out. This authenticity signal is your description\'s strongest element. To push toward 9+, make the personal connection even more explicit: one sentence about why you started this (your own experience learning to code without school support) would elevate the entire description.' },
      },
      strengths: ['Clear founding narrative', 'Educational leadership angle'],
      improvements: ['Add membership growth numbers', 'Specify curriculum created'],
      overallRationale: 'Founding a club is inherently strong but the description doesn\'t maximize the story. Numbers and specifics would transform this.',
    },
    activityScore: {
      total: 8.2,
      breakdown: {
        tierAssessment: { score: 6, maxScore: 10, weight: 0.30, weightedScore: 1.8, rationale: 'Founding your school\'s first CS club addresses a genuine gap and shows initiative, but the scope remains school-level. For context: at competitive high schools, 5-10% of students hold club president positions. What distinguishes founders from presidents is whether the organization outlasts them and creates systemic change. Your 60-participant hackathon is a strong start, but compare to Tier 2 benchmarks like state Science Olympiad medalists (top 3 among 200+ schools) or USACO Gold division (top ~1,000 nationally). You\'re building toward regional impact but haven\'t yet achieved external recognition beyond your immediate school network. Note: The contextual analysis (which factors in story arc and constraint adjustments) assigned Tier 2 to this activity, reflecting the founding narrative\'s strength even as the raw tier metric lands at T3.', tier: 2 },
        recognitionLevel: { score: 7, maxScore: 10, weight: 0.25, weightedScore: 1.75, rationale: 'School-level recognition with growing regional visibility. The club is well-known within your school (35+ active members, weekly meetings, annual hackathon), but recognition hasn\'t yet extended beyond campus. A 7 reflects solid internal impact — you\'re the go-to CS leader at your school. To reach 8-9, you\'d need external validation: district-wide CS education recognition, partnerships with local tech companies, or your members placing in regional competitions. The 60-participant hackathon is a strong proof point, but it drew primarily from your own student body rather than multiple schools.', level: 'school' },
        leadershipImpact: { score: 9, maxScore: 10, weight: 0.125, weightedScore: 1.125, rationale: 'This is your standout dimension. You didn\'t join an existing club — you identified a gap in your school\'s CS offerings, recruited founding members, designed the curriculum, and built the organization from zero. That\'s fundamentally different from inheriting a presidency. The distinction between "president of existing club" and "founded a new organization" is enormous in admissions. You created infrastructure that will outlast your time there: a curriculum, a hackathon tradition, and a pipeline for underclassmen. The 9/10 reflects the depth of founding leadership; 10/10 would require the organization to have spawned chapters at other schools or received external institutional recognition.', isApplicable: true, role: 'founder', impactScope: 'organization' },
        communityCharacter: { score: 8.5, maxScore: 10, weight: 0.15, weightedScore: 1.275, rationale: 'Creating CS access for an underserved community is a powerful narrative. As a first-gen student who taught yourself to code, you\'re not just running a club — you\'re building a bridge that didn\'t exist before. The authenticity signal is strong because your motivation is clearly personal: you experienced the gap in CS education firsthand and decided to fill it. Admissions officers at tech-focused schools will recognize this as genuine service leadership rather than resume padding. The 8.5 reflects both the service component and the personal authenticity. To reach 9+, quantify the impact: how many members had never coded before joining? How many went on to take AP CS?', primaryTrait: 'service', communityBenefit: 'significant', authenticitySignal: 'highly_authentic' },
        commitmentProgression: { score: 8.5, maxScore: 10, weight: 0.175, weightedScore: 1.4875, rationale: '2 years of sustained commitment with clear organizational growth trajectory: from founding with a handful of members to 35+ active participants, from informal meetups to structured curriculum and an annual hackathon. This progression demonstrates both persistence and the ability to scale. The growth from founder to institution-builder is the kind of trajectory admissions officers look for — it shows you can sustain effort beyond the initial excitement of starting something new. Compare: most student-founded clubs plateau or dissolve within a year; yours has grown consistently. The 8.5 reflects strong progression; 9+ would require evidence of organizational maturity like formal succession planning or multi-year strategic vision.', years: 2, showsProgression: true, sustainedThroughJunior: true },
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
];

// ============================================================================
// PORTFOLIO SCORE RUBRIC
// ============================================================================

const portfolioRubricData = {
  overallScore: { total: 7.2, confidence: 0.82, formula: 'Weighted: tier(30%) + spike(25%) + coherence(20%) + major(15%) + presentation(10%)', rationale: 'Strong Tier 2 anchors with authentic first-gen narrative. Spike is emerging but not yet mature. Descriptions need work.' },
  harvardScale: { rating: 3 as 1 | 2 | 3 | 4 | 5 | 6, description: 'Good (top 15%): School leader, meaningful local impact, developing focus', rationale: 'Two Tier 2 activities (research + CS club) with authentic first-gen context and emerging STEM spike. Needs Tier 1 achievement or publication for Outstanding.' },
  breakdown: {
    tierDistribution: { score: 7, maxScore: 10 as 10, rationale: 'Two Tier 2 activities anchor the portfolio. No Tier 1 yet but the research is close.' },
    spikeDetection: { score: 6.5, maxScore: 10 as 10, rationale: 'CS/tech spike is visible through research and CS club, but needs deeper external validation.' },
    coherence: { score: 7.8, maxScore: 10 as 10, rationale: 'Strong thematic coherence — tech for community runs through both activities.' },
    majorAlignment: { score: 7.5, maxScore: 10 as 10, rationale: 'Strong CS alignment through research and club.' },
    presentationQuality: { score: 6.0, maxScore: 10 as 10, rationale: 'Descriptions average 6.0/10. Quantification is the primary gap.' },
  },
  narrative: {
    archetype: 'innovator',
    storyLine: 'A resourceful first-gen student who taught themselves ML while working 20 hours/week, then channeled that knowledge into research addressing their own community\'s healthcare gaps and building CS education infrastructure.',
    twoSentencePitch: 'This student doesn\'t just study computer science — they deploy it where it matters most. From ML-powered healthcare research to founding a CS club in an underserved community, they\'re building the tech infrastructure they never had.',
    differentiators: ['Self-taught ML researcher addressing local healthcare gaps', 'Founded CS education pipeline as first-gen student', 'Authentic work/family obligations add character depth'],
    commonalities: ['CS-focused activities (common for STEM applicants)'],
  },
  competitiveContext: {
    assessment: 'Competitive at selective schools, strong at match schools. The research and first-gen narrative create genuine differentiation.',
    targetSchoolFit: 'Strong fit for research-oriented universities that value socioeconomic diversity and community impact.',
    differentiators: ['Independent ML research with community application', 'First-gen narrative with authentic work obligations', 'Founded organization rather than just joining'],
    commonalities: ['CS club (many applicants lead STEM clubs)'],
    competitiveGaps: ['No Tier 1 national recognition', 'Research not yet published', 'Missing competitive programming or hackathon results'],
  },
  keyStrengths: ['Authentic first-gen narrative with tech-for-community theme', 'Two Tier 2 anchors (research + founding)', 'Strong coherence score (78/100)'],
  keyGaps: ['No Tier 1 achievement', 'Descriptions under-quantified across the board', 'Spike is emerging, not mature'],
  prioritizedRecommendations: [
    { priority: 1 as 1, recommendation: 'Quantify all activity descriptions — especially research metrics', impact: 'Could raise avg description score from 5.8 to 7.5+', effort: 'low' as 'low' },
    { priority: 2 as 2, recommendation: 'Secure research publication or presentation', impact: 'Would push research toward Tier 1 and improve Harvard Scale', effort: 'medium' as 'medium' },
    { priority: 3 as 3, recommendation: 'Expand CS Club to multiple schools for Tier 1 push', impact: 'Elevates founding story to regional/national scale', effort: 'medium' as 'medium' },
  ],
  activityScores: activityScoresData,
  metadata: {
    scoredAt: '2026-02-20T12:00:00Z',
    modelUsed: 'claude-sonnet-4-5-20250929',
    totalActivities: 2,
    averageDescriptionScore: 6.0,
    averageActivityScore: 8.2,
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
  },

  // --- Portfolio-Level Analysis ---
  tierDistribution: { tier1: 0, tier2: 2, tier3: 0, tier4: 0, portfolioTier: 2, tierRationale: 'Two Tier 2 activities anchor the portfolio at the Tier 2 level' },
  spikeAnalysis: {
    hasSpike: true,
    spikeType: 'stem',
    spikeStrength: 'moderate',
    spikeActivities: ['research', 'cs-club'],
    spikeEvidence: ['ML research with real-world application', 'Founded CS education organization'],
    spikeAuthenticity: 78,
    spikeNarrative: 'Emerging CS/tech spike visible through research and CS club founding. Needs deeper external validation to mature.',
    spikeDevelopmentStage: 'emerging',
  },
  coherenceAnalysis: {
    score: 78,
    assessment: 'strong',
    primaryTheme: 'Technology as Community Infrastructure',
    secondaryThemes: ['First-Generation STEM Pipeline Builder', 'Responsibility-Driven Excellence'],
    thematicConnections: [
      { activity1: 'research', activity2: 'cs-club', connection: 'Both create CS knowledge and infrastructure', strength: 'strong' },
    ],
    disconnectedActivities: [],
    narrativeThread: 'A resourceful first-gen student building technology infrastructure for their underserved community while shouldering real family and work obligations.',
  },
  majorAlignment: {
    intendedMajor: 'computer_science',
    alignmentScore: 82,
    stronglyAligned: ['research', 'cs-club'],
    moderatelyAligned: [],
    misaligned: [],
    gaps: ['No competitive programming or hackathon results'],
    competitiveBenchmark: 'Strong alignment for CS major — research and founding differentiate from typical CS applicants.',
  },
  depthBreadthProfile: { profile: 'focused', depthScore: 75, breadthScore: 55, optimalBalance: 'Slightly deep-leaning, which is ideal for STEM applicants.' },
  hiddenGems: {
    undersoldActivities: [],
    workFamilyContributions: { present: false, activities: [], value: '' },
    constrainedExcellence: { present: true, context: 'First-gen, rural', activities: ['research', 'cs-club'] },
  },
  competitiveAssessment: {
    overallStrength: 'competitive',
    strengthAreas: ['Authentic first-gen narrative', 'Original research', 'Founding leadership'],
    weaknessAreas: ['No Tier 1 national recognition', 'Descriptions under-quantified'],
    differentiators: ['ML research on own community healthcare', 'Work obligations elevate every achievement'],
    commonalities: ['CS club (many applicants lead STEM clubs)'],
    competitiveEdge: 'The intersection of authentic economic constraint and high intellectual achievement creates a profile that is impossible to fabricate.',
  },
  gapsIdentified: [
    { gap: 'No Tier 1 (national/international) recognition', severity: 'significant', impactOnApplication: 'Limits competitiveness at most selective schools', affectedSchools: ['Ivy League', 'Stanford', 'MIT'] },
    { gap: 'Missing competitive programming or hackathon results', severity: 'minor', impactOnApplication: 'Common for CS applicants but not required given research strength', affectedSchools: ['MIT', 'CMU'] },
  ],
  commonAppReadiness: {
    readyForSubmission: false,
    activitiesCount: 2,
    topActivitiesIdentified: ['research', 'cs-club'],
    orderingRecommendation: ['research', 'cs-club'],
    descriptionReadiness: [
      { activityId: 'research', ready: false, issues: ['Needs quantified metrics'] },
      { activityId: 'cs-club', ready: false, issues: ['Needs specific growth numbers'] },
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
    storyInfluencedScores: [],
  },
  teachingCandidates: {
    deepTeachingIds: ['research', 'cs-club'],
    mediumTeachingIds: [],
    quickEncouragementIds: [],
    skipTeachingIds: [],
    selectionCriteria: { deepThreshold: 7.5, mediumThreshold: 5.0, skipThreshold: 9.0 },
  },
  teachingPriorities: [
    { activityId: 'research', priority: 1, reason: 'Highest-potential activity with clear improvement paths', expectedImpact: 'transformative', teachingFocus: ['description quantification', 'publication strategy'] },
    { activityId: 'cs-club', priority: 2, reason: 'Strong foundation needing metric-based strengthening', expectedImpact: 'significant', teachingFocus: ['growth documentation', 'impact measurement'] },
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

const MOCK_DATA: ActivityWorkshopPipelineResult = {
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
      { thread: 'Technology as Community Infrastructure', activityIds: ['cs-club', 'research'], strength: 'strong', evidence: 'Founded CS club and conducts ML research on rural healthcare' },
      { thread: 'First-Generation STEM Pipeline Builder', activityIds: ['cs-club', 'research'], strength: 'emerging', evidence: 'Creating pathways for other first-gen students through teaching and research' },
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
    ],
    spikeHypothesis: {
      likelySpike: true,
      spikeArea: 'Computer Science & Educational Leadership',
      spikeActivityIds: ['research', 'cs-club'],
      maturity: 'emerging',
      evidence: 'Two CS-related activities spanning research and education. Needs deeper external validation to mature.',
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
              issue: 'Role description subordinates your contribution',
              whyItMatters: {
                text: 'Your current opening — "Worked with professor" — immediately frames you as an assistant rather than a researcher. In the 6-8 seconds an admissions officer spends scanning each activity, that first phrase sets the entire frame.\n\nHere\'s the critical distinction: "Worked with professor on NLP project" reads as "student helped a professor." But this was YOUR pipeline, YOUR analysis, with faculty guidance. The description should lead with what YOU built, not who you worked under.\n\nAdmissions officers at research universities use a mental shortcut called "agency detection" — they scan for signals of whether a student drove the work or participated in someone else\'s work. Opening with "Worked with professor" triggers the "participant" categorization. Opening with "Built Python/pandas pipeline" triggers the "driver" categorization. Same research, dramatically different impression.',
                citations: [],
                psychology: 'The first 3-5 words of an activity description function as a "cognitive anchor" — they set the frame through which the reader interprets everything that follows. When the anchor is "Worked with professor," every subsequent detail is filtered through the lens of mentored assistance. When the anchor is "Built Python/pandas pipeline," every detail is filtered through the lens of independent technical capability.\n\nThis matters because admissions committees are specifically trained to distinguish between "resume padding" research (where a student shadows a professor\'s existing project) and authentic independent work. Your description currently triggers the wrong pattern.',
                quote: '"Lead with your verb, not your supervisor. The most common mistake in research descriptions is giving credit to the lab before giving credit to yourself."',
                quoteSource: 'Former MIT admissions officer, on research activity descriptions',
              },
              howToFix: 'Restructure the opening to lead with YOUR technical contribution. Replace "Worked with professor on NLP project analyzing rural healthcare access patterns" with a description that starts with what you built.\n\nThe fix is simple: move the strongest technical verb to position one. Instead of "Worked with professor on NLP project," write "Built Python/pandas pipeline... for NLP healthcare access analysis." The professor relationship can be mentioned elsewhere (Additional Information section) — your 150 characters should showcase YOUR work.',
              exampleBefore: 'Worked with professor on NLP project analyzing rural healthcare access patterns',
              exampleAfter: 'Built Python/pandas pipeline for NLP healthcare access analysis',
              transformationAnalysis: 'Change: "Worked with professor on NLP project analyzing rural healthcare access patterns" → "Built Python/pandas pipeline... for NLP healthcare access analysis"\n\nThis restructure accomplishes three things simultaneously:\n1. Agency shift: "Built" vs "Worked with" — you\'re the subject performing the action, not assisting someone else\n2. Technical specificity: "Python/pandas pipeline" replaces the vague "NLP project" — the reader now knows your exact tech stack\n3. Efficient phrasing: "healthcare access analysis" is tighter than "analyzing rural healthcare access patterns" — saves characters for other details\n\nThe net effect: the reader\'s first impression shifts from "research assistant" to "independent engineer."',
              priority: 'high',
            },
            {
              issue: 'Paper submission status creates authenticity uncertainty',
              whyItMatters: {
                text: 'The phrase "submitted to undergraduate journal" raises more questions than it answers. Admissions officers are trained to read between the lines, and "submitted" without a status update often signals one of two things: the paper was rejected, or the student is inflating a work-in-progress.\n\nNeither reading is fair to your actual work — but the description invites that skepticism by being vague about the venue and status. "Undergraduate journal" sounds less rigorous than it may be, and "submitted" without "accepted" or "under review" leaves the outcome ambiguous.\n\nThe fix is straightforward: name the actual journal and clarify the current status. "Under review at Journal of Health Informatics" is specific, verifiable, and signals active academic engagement without overclaiming.',
                citations: [],
                research: 'NACAC research on admissions reading patterns shows that vague publication claims are flagged for skepticism at a 3x higher rate than specific ones. Naming the venue and clarifying status (under review, accepted, published) eliminates ambiguity and builds credibility.',
                quote: '"When a student writes \'submitted paper to conference\' without naming the venue or outcome, I assume average. When they write \'paper under review at [specific journal],\' I assume competence. The specificity signals honesty."',
                quoteSource: 'Admissions reader, University of Chicago',
              },
              howToFix: 'Replace the vague venue and status with specifics:\n\n1. Name the journal: "J. Health Informatics" (or whatever the actual venue is) instead of "undergraduate journal"\n2. Clarify status: "under review" instead of "submitted" — this implies the paper passed initial screening and is being evaluated\n3. Use the standard academic abbreviation to save characters: "J. Health Informatics" rather than "Journal of Health Informatics"',
              exampleBefore: 'Co-authored paper submitted to undergraduate journal',
              exampleAfter: 'co-authored paper under review, J. Health Informatics',
              priority: 'high',
            },
            {
              issue: 'Technical contribution lacks specificity',
              whyItMatters: {
                text: 'Your description says "Built data pipeline processing 50,000 patient records" — which is good, but "data pipeline" is generic enough to mean anything from a SQL query to a distributed computing system. At selective STEM programs, the technical vocabulary in your description functions as a competency signal.\n\nWhen a CS admissions reviewer sees "data pipeline," they don\'t know your skill level. When they see "Python/pandas pipeline processing 50K patient records," they immediately place you in the right technical bracket. The technology name (Python/pandas) and the concise number format (50K vs 50,000) both signal fluency — you speak the language of engineering, not the language of someone describing engineering from the outside.\n\nAdditionally, "50K" instead of "50,000" saves 3 characters — critical in a 150-character limit where every character must earn its place.',
                citations: [],
                psychology: 'Technical vocabulary functions as an in-group signal in STEM admissions. When reviewers see standard engineering shorthand (50K, NLP, Python/pandas), they unconsciously categorize the applicant as "one of us" — someone who already operates in the technical world rather than observing it from the outside.',
              },
              howToFix: 'Two specific changes:\n\n1. Add the technology stack: "data pipeline" → "Python/pandas pipeline" — this names the exact tools you used, signaling real technical depth\n2. Use engineering shorthand for numbers: "50,000" → "50K" — this saves 3 characters and reads more naturally to technical reviewers\n\nBoth changes are small in character count but significant in signal value. They transform a generic data claim into a specific technical achievement.',
              exampleBefore: 'Built data pipeline processing 50,000 patient records',
              exampleAfter: 'processing 50K patient records',
              priority: 'medium',
            },
          ],
          descriptionOptimization: {
            originalDescription: 'Worked with professor on NLP project analyzing rural healthcare access patterns. Built data pipeline processing 50,000 patient records. Co-authored paper submitted to undergraduate journal.',
            optimizedDescription: 'Built Python/pandas pipeline processing 50K patient records for NLP healthcare access analysis; co-authored paper under review, J. Health Informatics.',
            characterCount: 150,
            changesExplained: [
              { change: 'Led with YOUR technical contribution', reason: 'Restructured opening from "Worked with professor" to "Built Python/pandas pipeline" — shifts reader perception from research assistant to independent engineer' },
              { change: 'Named specific technology stack', reason: '"Python/pandas pipeline" replaces generic "data pipeline" — signals real technical fluency to CS admissions reviewers' },
              { change: 'Upgraded venue and clarified status', reason: '"Under review, J. Health Informatics" replaces vague "submitted to undergraduate journal" — adds credibility and eliminates ambiguity about paper outcome' },
              { change: 'Used engineering shorthand (50K)', reason: 'Saves 3 characters while signaling technical in-group fluency — "50K" reads more naturally to STEM reviewers than "50,000"' },
            ],
            alternativeVersions: [
              'Developed NLP pipeline (Python/pandas) analyzing 50K patient records across rural healthcare systems; co-authored paper under review at J. Health Informatics.',
              'Independent NLP research: built data pipeline processing 50K records to map rural healthcare access gaps; paper under review, J. Health Informatics.',
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
    ],
    quickEncouragements: [],
    skippedActivities: [],
    portfolioTeaching: {
      narrativeTeaching: {
        currentState: 'Your portfolio tells a compelling story of a first-gen student building technology infrastructure for their community, but the descriptions don\'t yet do the story justice.',
        recommendation: 'Invest 30 minutes quantifying each description. This single action could raise your overall presentation score by 2+ points.',
        twoSentencePitch: 'This student doesn\'t just study CS — they deploy it where it matters. From ML healthcare research to founding a CS club, they\'re building the tech infrastructure their community never had.',
      },
      coherenceTeaching: {
        currentScore: 78,
        improvements: ['Strengthen connection between research and club narratives'],
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
            original: 'Worked with professor on NLP project analyzing rural healthcare access patterns. Built data pipeline processing 50,000 patient records. Co-authored paper submitted to undergraduate journal.',
            suggested: 'Built Python/pandas pipeline processing 50K patient records for NLP healthcare access analysis; co-authored paper under review, J. Health Informatics.',
            characterCount: 150,
            changesApplied: [
              { element: 'Agency restructure', original: 'Worked with professor on NLP project', transformed: 'Built Python/pandas pipeline... for NLP healthcare access analysis', rationale: 'Leading with YOUR verb and tech stack shifts perception from research assistant to independent engineer' },
              { element: 'Technical specificity', original: 'data pipeline processing 50,000', transformed: 'Python/pandas pipeline processing 50K', rationale: 'Named technology + engineering shorthand signals technical fluency' },
              { element: 'Venue and status upgrade', original: 'submitted to undergraduate journal', transformed: 'under review, J. Health Informatics', rationale: 'Specific journal name + active status eliminates ambiguity and builds credibility' },
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
    ],
    actionPlan: {
      immediate: [
        { action: 'Quantify ML research impact — model accuracy, dataset size, patient outcomes affected', impact: 'Elevates research from "impressive" to "measurable"' },
        { action: 'Document CS Club growth metrics — members, events, curriculum modules created', impact: 'Strengthens leadership narrative with concrete numbers' },
      ],
      shortTerm: [
        { action: 'Follow up on research paper submission status', impact: 'Publication would push toward Tier 1', deadline: '3 months' },
        { action: 'Document CS Club impact with specific student outcomes', impact: 'Strengthens founding narrative with measured results' },
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
        { activityId: 'research', combinedScore: 7.6, rank: 1 },
        { activityId: 'cs-club', combinedScore: 7.8, rank: 2 },
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
      recommendedOrder: ['research', 'cs-club'],
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
      { name: 'Technology as Community Infrastructure', activityIds: ['cs-club', 'research'], manifestation: 'Building CS knowledge and applying it to community problems', admissionsValue: 'Shows sustained commitment to using tech for social good', synergy: 'Research produces knowledge, CS club distributes it' },
      { name: 'First-Generation STEM Pipeline', activityIds: ['cs-club', 'research'], manifestation: 'Creating access for others like them', admissionsValue: 'Shows awareness of systemic gaps and initiative to address them', synergy: 'Creating the support system this student never had, for others like them' },
    ],
    elevations: [],
    spike: {
      primarySpike: { area: 'Computer Science & Educational Leadership', activities: ['research', 'cs-club'], depth: 'Emerging spike with research anchor', distinctiveness: 'Self-taught ML applied to community healthcare is highly distinctive' },
      supportingElements: [],
      complementaryBreadth: [],
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

export default MOCK_DATA;
