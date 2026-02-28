/**
 * Achievement Intelligence Database — Deep Calibration Benchmarks
 *
 * Massively expanded benchmark database for nuance calibration.
 * Each category includes subcategories, achievement ladders, role hierarchies,
 * and tier-specific entries with selectivity ratios and prestige rankings.
 *
 * Sources: Sara Harberson, College Board, MIT/Stanford/Harvard admissions blogs,
 * NACAC surveys, competition statistics, published acceptance rates.
 *
 * Cost: $0.00 (pure data, no LLM calls)
 */

import type {
  AchievementCategory,
  AchievementEntry,
  SubcategoryProfile,
  AchievementLadderEntry,
  RoleHierarchyEntry,
} from './nuanceCalibrationTypes';
import type { InternalTier } from './types';

// ============================================================================
// ACHIEVEMENT DATABASE
// ============================================================================

export const ACHIEVEMENT_DATABASE: Record<string, AchievementCategory> = {

  // ========================================================================
  // 1. STEM RESEARCH
  // ========================================================================
  stem_research: {
    label: 'STEM Research',
    keywords: ['research', 'lab', 'publication', 'paper', 'journal', 'thesis', 'experiment', 'data', 'professor', 'university research', 'clinical', 'epidemiology'],
    subcategories: [
      { key: 'bench_science', name: 'Bench/Lab Science', prestigeLevel: 2, prestigeContext: 'Hands-on experimental work valued highly for STEM majors', typicalTier: 3, keywords: ['lab', 'bench', 'experiment', 'pcr', 'gel', 'microscopy', 'wet lab'] },
      { key: 'computational', name: 'Computational Research', prestigeLevel: 2, prestigeContext: 'ML/AI/bioinformatics research increasingly valued', typicalTier: 3, keywords: ['computational', 'algorithm', 'simulation', 'modeling', 'bioinformatics', 'machine learning', 'data analysis'] },
      { key: 'clinical_trials', name: 'Clinical Research', prestigeLevel: 1, prestigeContext: 'Direct patient impact; hardest for HS students to access', typicalTier: 3, keywords: ['clinical', 'trial', 'patient', 'irb', 'hospital', 'medical center'] },
      { key: 'field_research', name: 'Field Research', prestigeLevel: 3, prestigeContext: 'Ecology/environmental field work shows dedication', typicalTier: 4, keywords: ['field', 'ecology', 'wildlife', 'environmental', 'sampling', 'biodiversity'] },
      { key: 'engineering_research', name: 'Engineering Research', prestigeLevel: 2, prestigeContext: 'Applied research with tangible prototypes valued', typicalTier: 3, keywords: ['engineering', 'prototype', 'design', 'fabrication', 'robotics research', 'materials'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Lab assistant doing routine tasks (washing glassware, data entry)', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Independent project with faculty guidance, learning methodology', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Original research presented at conference or submitted for publication', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Published in peer-reviewed journal, RSI/PRIMES alum, national recognition', typicalScoreRange: [9, 10], internalTier: 1 },
    ],
    roleHierarchy: [
      { role: 'Principal Investigator / Lead Researcher', scoreModifier: 1.0, context: 'Designed and led the research independently' },
      { role: 'Co-Investigator', scoreModifier: 0.5, context: 'Significant intellectual contribution to study design' },
      { role: 'Research Assistant (independent)', scoreModifier: 0.0, context: 'Conducted experiments with some autonomy' },
      { role: 'Research Assistant (directed)', scoreModifier: -0.3, context: 'Followed protocols set by mentor' },
      { role: 'Lab Helper / Data Entry', scoreModifier: -0.7, context: 'Routine tasks without intellectual contribution' },
    ],
    tiers: {
      1: [
        { activity: 'Published first-author paper in peer-reviewed journal', scoreRange: [9.5, 10], context: '<0.01% of HS students; graduate-level accomplishment', selectivityRatio: 'Fewer than 200 HS students/year in US', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'First-author status means primary intellectual contribution' },
        { activity: 'RSI (Research Science Institute) alum', scoreRange: [9.5, 10], context: '~100 selected from 3,000+ globally; MIT-hosted', selectivityRatio: '~100 of 3,000+ (~3.3%)', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'Most selective HS research program in the world' },
        { activity: 'Regeneron STS finalist', scoreRange: [9.5, 10], context: '40 finalists from ~2,200+ applicants', selectivityRatio: '40 of 2,200+ (~1.8%)', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'Often called junior Nobel Prize' },
        { activity: 'Published computational research with novel algorithm', scoreRange: [9, 10], context: 'Developing new algorithms as HS student is exceptionally rare', subcategory: 'computational', fieldPrestige: 1, keyDifferentiator: 'Novel algorithmic contribution vs applying existing tools' },
        { activity: 'PRIMES / PRIMES-USA researcher with published results', scoreRange: [9, 10], context: 'MIT-hosted math research program; mentored by graduate students', selectivityRatio: 'PRIMES: ~30 of 400+ applicants (7.5%)', subcategory: 'computational', fieldPrestige: 1, keyDifferentiator: 'PRIMES publication vs summer research; year-long mentored program' },
        { activity: 'Patent filed or pending from original research', scoreRange: [9, 10], context: 'Provisional patent filing demonstrates commercially viable innovation', subcategory: 'engineering_research', fieldPrestige: 1, keyDifferentiator: 'Filed patent vs prototype vs concept; legal filing is verifiable' },
      ],
      2: [
        { activity: 'Named co-author on faculty publication', scoreRange: [7.5, 8.5], context: 'Faculty add names for genuine contribution, not attendance', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'Co-author vs acknowledgment section' },
        { activity: 'Multi-year university lab placement with original project', scoreRange: [7, 8.5], context: 'Sustained research over 1+ years with documented methodology', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Duration + independence distinguish from summer programs' },
        { activity: 'Competitive summer research program (SSP, COSMOS, Clark Scholar)', scoreRange: [7, 8], context: 'Selective programs (5-15% acceptance) validate research potential', selectivityRatio: 'SSP: 108 of ~750 (~14%)', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Program selectivity serves as external validation' },
        { activity: 'Presented original research at regional/state conference', scoreRange: [7, 8], context: 'Peer-reviewed presentation shows work withstood scrutiny', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Conference presentation vs poster session' },
        { activity: 'IRB-approved clinical research project', scoreRange: [7.5, 8.5], context: 'IRB approval is a significant barrier for HS students', subcategory: 'clinical_trials', fieldPrestige: 1, keyDifferentiator: 'IRB approval signals real clinical involvement' },
        { activity: 'ML/AI project with published results or competition win', scoreRange: [7, 8.5], context: 'Applied ML with measurable results on real data', subcategory: 'computational', fieldPrestige: 1, keyDifferentiator: 'Novel application vs tutorial replication' },
        { activity: 'Poster at major scientific conference (AGU, ACS, APS)', scoreRange: [7, 8], context: 'Accepted poster at professional conference (not student-only event)', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Major professional conference vs student conference vs school fair' },
        { activity: 'Engineering prototype solving real problem with external testing', scoreRange: [7, 8.5], context: 'Working prototype tested with real users or in real conditions', subcategory: 'engineering_research', fieldPrestige: 2, keyDifferentiator: 'Tested prototype vs concept model vs CAD drawing only' },
        { activity: 'Environmental field research with published/shared dataset', scoreRange: [7, 8], context: 'Original field data collection contributing to scientific knowledge', subcategory: 'field_research', fieldPrestige: 2, keyDifferentiator: 'Published dataset vs personal collection; contributes to citizen science or research' },
      ],
      3: [
        { activity: 'Summer lab intern with assigned tasks', scoreRange: [5.5, 6.5], context: 'Common among top-school applicants; describe YOUR contribution', subcategory: 'bench_science', fieldPrestige: 3, keyDifferentiator: 'Assigned tasks vs self-directed inquiry' },
        { activity: 'School science fair project (state level)', scoreRange: [5.5, 6.5], context: 'State fair participation is competitive but not rare', subcategory: 'bench_science', fieldPrestige: 3, keyDifferentiator: 'State-level competition vs school-only fair' },
        { activity: 'Independent computational project with real data', scoreRange: [5.5, 6.5], context: 'Self-directed data science on real problems shows initiative', subcategory: 'computational', fieldPrestige: 3, keyDifferentiator: 'Real data vs textbook exercises' },
        { activity: 'Hospital chart review / data collection assistant', scoreRange: [5.5, 6], context: 'Low autonomy but real clinical exposure', subcategory: 'clinical_trials', fieldPrestige: 4, keyDifferentiator: 'Data collection vs analysis vs interpretation' },
        { activity: 'Epidemiological data analysis project (CDC/WHO public data)', scoreRange: [5.5, 6.5], context: 'Analyzing public health data with statistical methods', subcategory: 'computational', fieldPrestige: 3, keyDifferentiator: 'Statistical analysis of real data vs descriptive summary; methodology matters' },
        { activity: 'Environmental monitoring/biodiversity survey (6+ months)', scoreRange: [5.5, 6.5], context: 'Sustained field data collection for ecology/environmental science', subcategory: 'field_research', fieldPrestige: 3, keyDifferentiator: '6+ months sustained collection vs one-day field trip; systematic methodology' },
        { activity: 'School-based independent research with faculty mentor', scoreRange: [5.5, 6.5], context: 'Self-directed research at school (not university lab) with teacher guidance', subcategory: 'bench_science', fieldPrestige: 3, keyDifferentiator: 'Independent project at school vs university lab placement; shows initiative without access privilege' },
        { activity: 'Engineering project with working prototype (school-based)', scoreRange: [5.5, 6], context: 'Built functional device/system for school engineering class or club', subcategory: 'engineering_research', fieldPrestige: 3, keyDifferentiator: 'Working prototype vs concept; school-based vs university lab' },
      ],
      4: [
        { activity: 'Lab shadowing / observation only', scoreRange: [4, 5], context: 'Watching without contributing; common but low impact', subcategory: 'bench_science', fieldPrestige: 5, keyDifferentiator: 'Observation vs hands-on participation' },
        { activity: 'School science fair (local only, no advancement)', scoreRange: [4, 4.5], context: 'Participation without competitive advancement', subcategory: 'bench_science', fieldPrestige: 4, keyDifferentiator: 'Local-only vs advancing to regionals/state' },
        { activity: 'Pay-to-play online research program (Polygence, Pioneer equivalents)', scoreRange: [4, 5], context: 'Paid programs provide mentorship but lack selectivity validation', subcategory: 'bench_science', fieldPrestige: 4, keyDifferentiator: 'Paid program vs selective free program (RSI, SSP); mentored vs independent' },
        { activity: 'Research literature review only (no original data)', scoreRange: [4, 4.5], context: 'Reviewed papers without conducting original experiments', subcategory: 'bench_science', fieldPrestige: 4, keyDifferentiator: 'Literature review vs original research; reading vs doing' },
      ],
      5: [
        { activity: 'Science club member with no projects', scoreRange: [2.5, 3.5], context: 'Club membership without active research contribution', subcategory: 'bench_science', fieldPrestige: 5, keyDifferentiator: 'Attendance vs active project work' },
        { activity: 'Watched research documentaries / YouTube science channels', scoreRange: [2, 3], context: 'Passive interest without any research activity', subcategory: 'bench_science', fieldPrestige: 5, keyDifferentiator: 'Consuming content vs producing research' },
      ],
    },
  },

  // ========================================================================
  // 2. STEM COMPETITIONS
  // ========================================================================
  stem_competition: {
    label: 'STEM Competitions',
    keywords: ['math', 'science', 'olympiad', 'usamo', 'usaco', 'usabo', 'usapho', 'physics', 'chemistry', 'biology', 'informatics', 'programming', 'hackathon', 'competition', 'science bowl', 'science fair', 'science olympiad'],
    subcategories: [
      { key: 'math', name: 'Mathematics Competitions', prestigeLevel: 1, prestigeContext: 'Math olympiads are the most recognized STEM competitions', typicalTier: 3, keywords: ['math', 'amc', 'aime', 'usamo', 'mathcounts', 'putnam', 'hmmt'] },
      { key: 'informatics', name: 'Computing/Informatics', prestigeLevel: 1, prestigeContext: 'USACO/IOI highly valued for CS applicants', typicalTier: 3, keywords: ['usaco', 'programming', 'informatics', 'competitive programming', 'codeforces', 'leetcode'] },
      { key: 'physics', name: 'Physics Competitions', prestigeLevel: 2, prestigeContext: 'USAPhO/IPhO smaller but equally prestigious', typicalTier: 3, keywords: ['physics', 'usapho', 'ipho', 'f=ma'] },
      { key: 'biology', name: 'Biology Competitions', prestigeLevel: 2, prestigeContext: 'USABO valued for pre-med and biology majors', typicalTier: 3, keywords: ['biology', 'usabo', 'ibo', 'anatomy'] },
      { key: 'science_olympiad', name: 'Science Olympiad', prestigeLevel: 3, prestigeContext: 'Team-based; valued but less selective than individual olympiads', typicalTier: 4, keywords: ['science olympiad', 'scioly', 'invitational'] },
      { key: 'science_fair', name: 'Science Fairs', prestigeLevel: 2, prestigeContext: 'ISEF is Tier 1; regional fairs are Tier 3', typicalTier: 3, keywords: ['science fair', 'isef', 'regeneron', 'intel', 'fair'] },
      { key: 'chemistry', name: 'Chemistry Competitions', prestigeLevel: 2, prestigeContext: 'USNCO/IChO valued for chemistry and pre-med', typicalTier: 3, keywords: ['chemistry', 'usnco', 'icho', 'usacho', 'acs', 'chem olympiad'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Participation in school-level competitions without advancement', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Qualifying for regional/state competitions; AIME qualifier, USACO Silver', typicalScoreRange: [4, 6], internalTier: 4 },
      { level: 'competitive', description: 'State-level awards; USACO Gold; Science Olympiad state medalist', typicalScoreRange: [6, 8.5], internalTier: 3 },
      { level: 'elite', description: 'National team; USAMO; USACO Platinum; ISEF Grand Award', typicalScoreRange: [9, 10], internalTier: 1 },
    ],
    roleHierarchy: [
      { role: 'Team Captain / Leader', scoreModifier: 0.5, context: 'Organized practice, mentored teammates' },
      { role: 'Individual Competitor', scoreModifier: 0.0, context: 'Results speak for themselves' },
      { role: 'Team Member (contributing)', scoreModifier: -0.2, context: 'Team events; individual contribution unclear' },
      { role: 'Team Member (participating)', scoreModifier: -0.5, context: 'On roster without significant individual results' },
    ],
    tiers: {
      1: [
        { activity: 'USAMO qualifier', scoreRange: [9.5, 10], context: 'Top ~250-500 of 300,000+ AMC participants', selectivityRatio: '500 of 300,000 (0.17%)', subcategory: 'math', fieldPrestige: 1, keyDifferentiator: 'USAMO vs AIME — two selection rounds beyond AMC' },
        { activity: 'USACO Platinum division', scoreRange: [9, 10], context: 'Top ~260 pre-college competitive programmers nationally', selectivityRatio: '~260 pre-college of 12,000+ active', subcategory: 'informatics', fieldPrestige: 1, keyDifferentiator: 'Platinum requires graduate-level algorithmic knowledge' },
        { activity: 'ISEF Grand Award winner', scoreRange: [9.5, 10], context: 'Top project among ~1,600 finalists from 80+ countries', selectivityRatio: '~88 Grand Awards of ~1,600 finalists', subcategory: 'science_fair', fieldPrestige: 1, keyDifferentiator: 'Grand Award vs Special Award vs participation' },
        { activity: 'USAPhO semifinalist (camp invitee) / IPhO team', scoreRange: [9.5, 10], context: 'Top 20 physics students invited to training camp; 5 selected for IPhO team', selectivityRatio: '~500 take USAPhO exam → 20 camp → 5 team', subcategory: 'physics', fieldPrestige: 1, keyDifferentiator: 'Camp invitee vs exam taker; IPhO team vs camp' },
        { activity: 'USABO finalist / IBO team', scoreRange: [9.5, 10], context: 'Top 20 biology students nationally', selectivityRatio: '20 finalists of 10,000+', subcategory: 'biology', fieldPrestige: 1, keyDifferentiator: 'National camp invitee' },
        { activity: 'USAChO study camp / IChO team', scoreRange: [9.5, 10], context: 'Top 20 chemistry students nationally', selectivityRatio: '20 study camp of 1,000+ USNCO exam takers', subcategory: 'chemistry', fieldPrestige: 1, keyDifferentiator: 'IChO team (4 students) vs study camp (20) vs nationals qualifier' },
        { activity: 'IMO / IPhO / IBO / IOI / IChO team member', scoreRange: [9.5, 10], context: 'Representing country at International Olympiad — pinnacle of HS STEM competition', selectivityRatio: 'IMO: 6 per country; IOI: 4 per country', subcategory: 'math', fieldPrestige: 1, keyDifferentiator: 'International team member vs national finalist vs qualifier' },
        { activity: 'USACO Camp invitee (Finalist)', scoreRange: [9.5, 10], context: 'Top ~26 competitive programmers invited to USACO training camp', selectivityRatio: '~26 camp invitees from 12,000+ active', subcategory: 'informatics', fieldPrestige: 1, keyDifferentiator: 'Camp invitee vs Platinum division; camp selects IOI team' },
      ],
      2: [
        { activity: 'AIME qualifier (high score 10+)', scoreRange: [7.5, 8.5], context: 'Top 2% of AMC takers; 10+ score is state-elite', selectivityRatio: '~6,000 of 300,000+ (2%)', subcategory: 'math', fieldPrestige: 2, keyDifferentiator: 'AIME score of 10+ vs bare qualifier' },
        { activity: 'USACO Gold division', scoreRange: [7, 8.5], context: 'Top ~1,000 competitive programmers', subcategory: 'informatics', fieldPrestige: 2, keyDifferentiator: 'Gold requires strong algorithmic fundamentals' },
        { activity: 'State Science Olympiad medalist (individual event)', scoreRange: [7, 8], context: 'Top 3 in state; teams have 200+ competing schools', subcategory: 'science_olympiad', fieldPrestige: 2, keyDifferentiator: 'Individual medal vs team placement' },
        { activity: 'Science Olympiad national individual medalist', scoreRange: [7.5, 8.5], context: 'Top 3 in event at national Science Olympiad tournament', selectivityRatio: '~120 teams at nationals from 5,000+; 3 medals per event', subcategory: 'science_olympiad', fieldPrestige: 1, keyDifferentiator: 'National medalist vs national participant vs state medalist' },
        { activity: 'Regional ISEF qualifier', scoreRange: [7, 8], context: 'Winning regional fair to advance to ISEF', selectivityRatio: '~10% of regional entries advance', subcategory: 'science_fair', fieldPrestige: 2, keyDifferentiator: 'ISEF qualification vs regional-only fair' },
        { activity: 'F=MA exam qualifier (USAPhO)', scoreRange: [7, 8], context: 'Top 400 physics students qualify for USAPhO', subcategory: 'physics', fieldPrestige: 2, keyDifferentiator: 'Qualifying for USAPhO exam round' },
        { activity: 'USNCO national exam qualifier', scoreRange: [7, 8], context: 'Top ~1,000 chemistry students qualify for national exam', selectivityRatio: '~1,000 of 16,000+ local section participants', subcategory: 'chemistry', fieldPrestige: 2, keyDifferentiator: 'National exam vs local section exam only' },
        { activity: 'HiMCM / M3 Challenge finalist team', scoreRange: [7, 8.5], context: 'Top math modeling teams nationally; demonstrates applied problem-solving', selectivityRatio: 'HiMCM: ~50-60 finalist teams of 1,000+', subcategory: 'math', fieldPrestige: 2, keyDifferentiator: 'Finalist vs participant; math modeling requires different skills than olympiads' },
        { activity: 'MATHCOUNTS National competitor', scoreRange: [7, 8], context: 'Top middle school mathematicians; early indicator of math talent', selectivityRatio: '224 national competitors from ~33,000 in competition series', subcategory: 'math', fieldPrestige: 2, keyDifferentiator: 'National (Countdown Round) vs state; middle school accomplishment still recognized' },
        { activity: 'Science Bowl national competition team', scoreRange: [7, 8], context: 'Top science trivia team selected through regional DOE competitions', selectivityRatio: '~65 teams at nationals from 5,000+ teams', subcategory: 'science_olympiad', fieldPrestige: 2, keyDifferentiator: 'National Science Bowl team vs regional only' },
        { activity: 'National hackathon winner (MLH Major League Hacking top prize)', scoreRange: [7, 8.5], context: 'Won top prize at recognized national hackathon event', subcategory: 'informatics', fieldPrestige: 2, keyDifferentiator: 'Top prize at national event vs category prize vs participation' },
      ],
      3: [
        { activity: 'AIME qualifier (bare cutoff)', scoreRange: [5.5, 6.5], context: 'Qualified but low AIME score; strong but not elite', subcategory: 'math', fieldPrestige: 3, keyDifferentiator: 'Bare qualifier vs high scorer' },
        { activity: 'USACO Silver division', scoreRange: [5.5, 6.5], context: 'Above-average programmer; thousands reach this level', subcategory: 'informatics', fieldPrestige: 3, keyDifferentiator: 'Silver is common among competitive students' },
        { activity: 'Science Olympiad state team member (no individual medal)', scoreRange: [5.5, 6], context: 'Team competition at state level without individual distinction', subcategory: 'science_olympiad', fieldPrestige: 3, keyDifferentiator: 'Team member vs individual medalist' },
        { activity: 'AMC Honor Roll (top 5%)', scoreRange: [5.5, 6], context: 'Top 5% nationally but below AIME cutoff', subcategory: 'math', fieldPrestige: 3, keyDifferentiator: 'Honor roll vs AIME qualifier' },
        { activity: 'MATHCOUNTS state competitor', scoreRange: [5.5, 6], context: 'State-level math competition in middle school; strong early foundation', subcategory: 'math', fieldPrestige: 3, keyDifferentiator: 'State MATHCOUNTS vs chapter only; middle school feeder activity' },
        { activity: 'Science Bowl regional winner / state competitor', scoreRange: [5.5, 6.5], context: 'Won regional Science Bowl or competed at state level', subcategory: 'science_olympiad', fieldPrestige: 3, keyDifferentiator: 'Regional winner vs participant; state qualifier vs regional only' },
        { activity: 'Science Olympiad invitational medalist (competitive invitational)', scoreRange: [5.5, 6.5], context: 'Medaled at well-known invitational (MIT, Scioly.org national)', subcategory: 'science_olympiad', fieldPrestige: 3, keyDifferentiator: 'Competitive invitational medal vs regular; prestige of invitational matters' },
        { activity: 'HiMCM / M3 Challenge participant (honorable mention or above)', scoreRange: [5.5, 6], context: 'Math modeling competition participation with recognition', subcategory: 'math', fieldPrestige: 3, keyDifferentiator: 'Honorable mention vs submitted vs finalist' },
        { activity: 'Chemistry local section Olympiad top scorer', scoreRange: [5.5, 6], context: 'Top scorer in ACS local section exam (not advancing to nationals)', subcategory: 'chemistry', fieldPrestige: 3, keyDifferentiator: 'Local section top scorer vs participant; not advancing to nationals' },
      ],
      4: [
        { activity: 'School math team member', scoreRange: [4, 5], context: '5-10% of students at competitive schools', subcategory: 'math', fieldPrestige: 4, keyDifferentiator: 'School-level without external competition results' },
        { activity: 'Local hackathon participant (no win)', scoreRange: [4, 5], context: 'Good initiative but without outcomes', subcategory: 'informatics', fieldPrestige: 4, keyDifferentiator: 'Participation without placing' },
        { activity: 'USACO Bronze division', scoreRange: [4, 5], context: 'Entry-level competitive programming', subcategory: 'informatics', fieldPrestige: 4, keyDifferentiator: 'Bronze is the starting division' },
        { activity: 'AMC 10/12 participation (no AIME, no Honor Roll)', scoreRange: [4, 4.5], context: 'Took AMC but without qualifying score; shows engagement', subcategory: 'math', fieldPrestige: 4, keyDifferentiator: 'Participation without advancement vs Honor Roll vs AIME qualifier' },
        { activity: 'Science Bowl school team member (no regional advancement)', scoreRange: [4, 5], context: 'On school Science Bowl team without competitive advancement', subcategory: 'science_olympiad', fieldPrestige: 4, keyDifferentiator: 'Team member without regional advancement vs regional winner' },
        { activity: 'Science Olympiad regional/invitational participant (no medals)', scoreRange: [4, 5], context: 'Competed in Science Olympiad without individual distinction', subcategory: 'science_olympiad', fieldPrestige: 4, keyDifferentiator: 'Participated without medals vs medalist; team participation' },
      ],
      5: [
        { activity: 'Science club member (no competitions entered)', scoreRange: [2.5, 3.5], context: 'Passive membership without competitive engagement', subcategory: 'science_olympiad', fieldPrestige: 5, keyDifferentiator: 'Club attendance vs competition participation' },
        { activity: 'Watched math/science competition videos only', scoreRange: [2, 3], context: 'Interest in competitive STEM without any participation', subcategory: 'math', fieldPrestige: 5, keyDifferentiator: 'Watching competitions vs competing' },
      ],
    },
  },

  // ========================================================================
  // 3. DEBATE & SPEECH
  // ========================================================================
  debate_speech: {
    label: 'Debate & Speech',
    keywords: ['debate', 'speech', 'forensics', 'model un', 'mock trial', 'mun', 'policy', 'lincoln-douglas', 'public forum', 'congress', 'extemporaneous', 'oratory'],
    subcategories: [
      { key: 'policy_debate', name: 'Policy Debate', prestigeLevel: 1, prestigeContext: 'Most rigorous; valued for pre-law and political applicants', typicalTier: 3, keywords: ['policy', 'cx', 'cross-examination'] },
      { key: 'ld_debate', name: 'Lincoln-Douglas Debate', prestigeLevel: 1, prestigeContext: 'Philosophy-focused; equally prestigious to policy', typicalTier: 3, keywords: ['lincoln-douglas', 'ld', 'value'] },
      { key: 'public_forum', name: 'Public Forum Debate', prestigeLevel: 2, prestigeContext: 'Most accessible format; still competitive at TOC level', typicalTier: 4, keywords: ['public forum', 'pf'] },
      { key: 'speech_events', name: 'Speech/IE Events', prestigeLevel: 3, prestigeContext: 'Individual events; less recognized than debate', typicalTier: 4, keywords: ['speech', 'oratory', 'extemporaneous', 'dramatic interp', 'original oratory'] },
      { key: 'model_un', name: 'Model United Nations', prestigeLevel: 3, prestigeContext: 'Good but extremely common among top applicants', typicalTier: 4, keywords: ['model un', 'mun', 'united nations', 'delegate', 'committee'] },
      { key: 'mock_trial', name: 'Mock Trial', prestigeLevel: 2, prestigeContext: 'Valued for pre-law; state/national competition is strong', typicalTier: 4, keywords: ['mock trial', 'trial', 'attorney', 'witness'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Local tournament participation without elimination round advances', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Regular competitor with occasional elimination round appearances', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'State qualifier/finalist; tournament wins at regional level', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'TOC qualifier; national finalist; state champion', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Team Captain / President', scoreModifier: 0.5, context: 'Organized team, ran practices, managed logistics' },
      { role: 'Varsity Competitor', scoreModifier: 0.0, context: 'Individual results matter more than title' },
      { role: 'JV Competitor', scoreModifier: -0.3, context: 'Less experienced division' },
      { role: 'Secretary-General (MUN)', scoreModifier: 0.7, context: 'Organized entire conference; significant leadership' },
    ],
    tiers: {
      1: [
        { activity: 'TOC (Tournament of Champions) finalist', scoreRange: [9, 10], context: 'Top 2 debaters at most prestigious tournament', selectivityRatio: '~200 qualifiers nationally from thousands', subcategory: 'policy_debate', fieldPrestige: 1, keyDifferentiator: 'TOC final round vs early elimination' },
        { activity: 'NSDA National Champion', scoreRange: [9.5, 10], context: 'Single national champion in each event', selectivityRatio: '1 of ~6,700 qualifiers', subcategory: 'ld_debate', fieldPrestige: 1, keyDifferentiator: 'Champion vs qualifier' },
        { activity: 'World Schools debate national team member', scoreRange: [9, 10], context: 'Selected to represent country in international debate', subcategory: 'policy_debate', fieldPrestige: 1, keyDifferentiator: 'National team selection vs domestic competition' },
      ],
      2: [
        { activity: 'TOC qualifier (2+ bids)', scoreRange: [7.5, 8.5], context: 'Consistently winning at championship-level tournaments', subcategory: 'policy_debate', fieldPrestige: 1, keyDifferentiator: 'Multiple bids vs single bid' },
        { activity: 'State debate champion', scoreRange: [7, 8.5], context: 'Top debater in state; represents ~1,000+ competitors', subcategory: 'ld_debate', fieldPrestige: 2, keyDifferentiator: 'State champion vs state qualifier' },
        { activity: 'NSDA Nationals qualifier (elimination rounds)', scoreRange: [7, 8], context: 'Qualifying and advancing at nationals', subcategory: 'public_forum', fieldPrestige: 2, keyDifferentiator: 'Elimination round advancement vs attendance' },
        { activity: 'NCFL Grand Nationals finalist (Catholic Forensic League)', scoreRange: [7, 8], context: 'National Catholic forensics tournament; one of the largest national speech/debate events', subcategory: 'public_forum', fieldPrestige: 2, keyDifferentiator: 'Grand Nationals finalist vs qualifier; second major national tournament after NSDA' },
        { activity: 'State Mock Trial champion team — NHSMTC (key role)', scoreRange: [7, 8], context: 'Attorney or key witness role on winning NHSMTC state team', subcategory: 'mock_trial', fieldPrestige: 2, keyDifferentiator: 'Key role vs ensemble member; NHSMTC (HS) vs AMTA (college)' },
        { activity: 'Best Delegate at major MUN conference', scoreRange: [7, 8], context: 'Top delegate at conferences like HMUN, YMUN', subcategory: 'model_un', fieldPrestige: 2, keyDifferentiator: 'Major conference vs local conference award' },
        { activity: 'State speech/IE champion (oratory, extemporaneous, interp)', scoreRange: [7, 8], context: 'State champion in individual speech event', subcategory: 'speech_events', fieldPrestige: 2, keyDifferentiator: 'State champion vs state qualifier in speech' },
        { activity: 'International MUN conference award (THIMUN, HMUN, YMUN)', scoreRange: [7, 8.5], context: 'Top delegate at internationally prestigious conference', subcategory: 'model_un', fieldPrestige: 1, keyDifferentiator: 'International conference vs regional; THIMUN/HMUN caliber' },
        { activity: 'Mock Trial national competition team (American Mock Trial Assoc.)', scoreRange: [7, 8.5], context: 'Qualifying and competing at national mock trial', subcategory: 'mock_trial', fieldPrestige: 1, keyDifferentiator: 'National competition vs state only' },
      ],
      3: [
        { activity: 'Regular tournament competitor with state-level results', scoreRange: [5.5, 6.5], context: 'Consistent competitor reaching elimination rounds', subcategory: 'ld_debate', fieldPrestige: 3, keyDifferentiator: 'Elimination rounds vs preliminary rounds only' },
        { activity: 'MUN conference award (local/regional)', scoreRange: [5.5, 6], context: 'Awards at local conferences are less distinguishing', subcategory: 'model_un', fieldPrestige: 3, keyDifferentiator: 'Local conference vs HMUN/YMUN caliber' },
        { activity: 'School debate team varsity member', scoreRange: [5.5, 6], context: 'Active competitor without championship results', subcategory: 'public_forum', fieldPrestige: 3, keyDifferentiator: 'Varsity member vs champion' },
        { activity: 'Speech IE event qualifier to state/nationals', scoreRange: [5.5, 6.5], context: 'Qualifying for higher-level speech competition', subcategory: 'speech_events', fieldPrestige: 3, keyDifferentiator: 'Qualifier vs champion; advancement shows competitiveness' },
        { activity: 'Secretary-General of school-hosted MUN conference', scoreRange: [5.5, 6.5], context: 'Organized entire conference; significant leadership role', subcategory: 'model_un', fieldPrestige: 3, keyDifferentiator: 'Conference organizer vs attendee; Sec-Gen vs delegate' },
        { activity: 'Mock trial team member (state qualifier)', scoreRange: [5.5, 6], context: 'Contributing member on competitive mock trial team', subcategory: 'mock_trial', fieldPrestige: 3, keyDifferentiator: 'State qualifier vs regional only' },
        { activity: 'Congressional debate state qualifier', scoreRange: [5.5, 6], context: 'Congressional debate combining legislation and speaking', subcategory: 'speech_events', fieldPrestige: 3, keyDifferentiator: 'State qualifier vs district participant' },
      ],
      4: [
        { activity: 'MUN club member (1-2 conferences/year)', scoreRange: [4, 5], context: 'Very common; needs awards or leadership to stand out', subcategory: 'model_un', fieldPrestige: 4, keyDifferentiator: 'Casual participation vs competitive delegation' },
        { activity: 'Novice debate competitor', scoreRange: [4, 4.5], context: 'First-year competitors learning the activity', subcategory: 'public_forum', fieldPrestige: 4, keyDifferentiator: 'Novice division vs open/varsity' },
        { activity: 'Speech club member (no competition results)', scoreRange: [4, 5], context: 'Practice without competitive engagement', subcategory: 'speech_events', fieldPrestige: 4, keyDifferentiator: 'Club practice vs tournament competition' },
        { activity: 'MUN crisis committee participant', scoreRange: [4, 5], context: 'Participated in crisis committee format', subcategory: 'model_un', fieldPrestige: 4, keyDifferentiator: 'Committee participant vs Best Delegate' },
      ],
      5: [
        { activity: 'Debate class participation only', scoreRange: [2.5, 3.5], context: 'Classroom debate without extracurricular competition', subcategory: 'public_forum', fieldPrestige: 5, keyDifferentiator: 'Class vs club vs competitive circuit' },
        { activity: 'Attended one MUN conference without award', scoreRange: [2.5, 3.5], context: 'Single conference attendance without competitive result', subcategory: 'model_un', fieldPrestige: 5, keyDifferentiator: 'One conference vs regular competitor' },
      ],
    },
  },

  // ========================================================================
  // 4. PERFORMING ARTS
  // ========================================================================
  performing_arts: {
    label: 'Performing Arts',
    keywords: ['music', 'theater', 'theatre', 'dance', 'orchestra', 'band', 'choir', 'vocal', 'instrument', 'piano', 'violin', 'acting', 'drama', 'performance', 'concert', 'recital', 'film'],
    subcategories: [
      { key: 'instrumental_classical', name: 'Classical Instrumental', prestigeLevel: 1, prestigeContext: 'Solo performance in competitions is highly valued', typicalTier: 3, keywords: ['violin', 'cello', 'piano', 'flute', 'oboe', 'classical', 'concerto', 'sonata'] },
      { key: 'instrumental_jazz', name: 'Jazz / Contemporary', prestigeLevel: 2, prestigeContext: 'Improvisational skill valued but less competitive structure', typicalTier: 4, keywords: ['jazz', 'saxophone', 'trumpet', 'improvisation', 'combo', 'big band'] },
      { key: 'vocal', name: 'Vocal Performance', prestigeLevel: 2, prestigeContext: 'All-State choir and competitions provide clear benchmarks', typicalTier: 4, keywords: ['choir', 'vocal', 'singing', 'a cappella', 'soprano', 'tenor', 'musical theater'] },
      { key: 'theater_acting', name: 'Theater Acting', prestigeLevel: 2, prestigeContext: 'Lead roles and competition results differentiate', typicalTier: 4, keywords: ['acting', 'theater', 'theatre', 'drama', 'play', 'musical', 'lead role', 'stage'] },
      { key: 'dance', name: 'Dance', prestigeLevel: 3, prestigeContext: 'Competition results and company affiliation matter', typicalTier: 4, keywords: ['dance', 'ballet', 'contemporary', 'hip hop', 'choreography', 'company'] },
      { key: 'film', name: 'Film / Media Production', prestigeLevel: 3, prestigeContext: 'Festival screenings provide external validation', typicalTier: 4, keywords: ['film', 'video', 'documentary', 'short film', 'director', 'cinematography'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'School ensemble member, beginner lessons', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Regional honors ensemble, school lead roles, local competitions', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'All-State selection, regional competition wins, pre-professional training', typicalScoreRange: [6, 8.5], internalTier: 3 },
      { level: 'elite', description: 'National YoungArts, professional performance, international competition', typicalScoreRange: [9, 10], internalTier: 1 },
    ],
    roleHierarchy: [
      { role: 'Soloist / Lead', scoreModifier: 0.7, context: 'Featured performer selected through audition' },
      { role: 'Section Leader / Principal', scoreModifier: 0.3, context: 'First chair or section leadership' },
      { role: 'Ensemble Member', scoreModifier: 0.0, context: 'Contributing member of group' },
      { role: 'Choreographer / Director', scoreModifier: 0.8, context: 'Creative leadership of productions' },
    ],
    tiers: {
      1: [
        { activity: 'National YoungArts Winner/Finalist (With Distinction)', scoreRange: [9.5, 10], context: '~150-170 With Distinction from 9,000-11,000 applicants annually', selectivityRatio: '~150-170 of 9,000-11,000 (~1.5-1.9%)', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'With Distinction vs Honorable Mention vs Merit; terminology updated 2024' },
        { activity: 'Professional orchestra/company member', scoreRange: [9, 10], context: 'Performing with adult professionals as a teenager', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'Professional ensemble vs youth orchestra' },
        { activity: 'International music competition finalist', scoreRange: [9, 10], context: 'Competitions like Menuhin, Tchaikovsky Junior', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'International vs national vs regional competition' },
        { activity: 'Pre-conservatory program at Juilliard/Curtis/NEC pre-college', scoreRange: [9, 10], context: 'Accepted to most selective pre-college music programs', selectivityRatio: 'Juilliard Pre-College: ~10% acceptance', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'Elite pre-conservatory vs regional youth program' },
        { activity: 'Jimmy Awards (National High School Musical Theatre Awards) nominee/winner', scoreRange: [9, 10], context: 'Top HS musical theater performers selected from 140,000+ participants across 50+ regional programs', selectivityRatio: '~80-90 nominees nationally', subcategory: 'theater_acting', fieldPrestige: 1, keyDifferentiator: 'Jimmy Award nominee vs regional winner vs local participant' },
        { activity: 'National Student Poets Program finalist', scoreRange: [9.5, 10], context: 'Five students nationally serve as literary ambassadors; run by Scholastic + Institute of Museum/Library Services', selectivityRatio: '5 selected nationally', subcategory: 'vocal', fieldPrestige: 1, keyDifferentiator: 'One of 5 national student poets vs Scholastic Gold Medal' },
        { activity: 'Sphinx Competition finalist (classical music, diversity focus)', scoreRange: [9, 10], context: 'Elite classical competition focused on Black/Latinx musicians; winners perform with Sphinx Symphony', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'Sphinx finalist vs regional competition; prestigious with social mission' },
        { activity: 'Pre-professional dance program (ABT, Joffrey, Ailey, SAB)', scoreRange: [9, 10], context: 'Accepted to elite pre-professional dance company/program through competitive audition', selectivityRatio: 'ABT JKO: ~5-10% acceptance', subcategory: 'dance', fieldPrestige: 1, keyDifferentiator: 'Pre-professional company (ABT/Joffrey/Ailey/SAB) vs regional studio vs school dance' },
      ],
      2: [
        { activity: 'All-State orchestra/band/choir (competitive state)', scoreRange: [7, 8.5], context: 'Top ~100 musicians statewide in competitive states', subcategory: 'instrumental_classical', fieldPrestige: 2, keyDifferentiator: 'All-State in CA/NY/TX vs small state' },
        { activity: 'Lead role in school musical/play (competitive program)', scoreRange: [7, 8], context: 'Competitive theater programs with audition processes', subcategory: 'theater_acting', fieldPrestige: 2, keyDifferentiator: 'Lead vs supporting vs ensemble role' },
        { activity: 'Regional/state dance company soloist', scoreRange: [7, 8], context: 'Selected as soloist through competitive audition', subcategory: 'dance', fieldPrestige: 2, keyDifferentiator: 'Soloist vs corps dancer' },
        { activity: 'Film screened at recognized festival', scoreRange: [7, 8.5], context: 'Festival selection provides external validation', subcategory: 'film', fieldPrestige: 2, keyDifferentiator: 'Recognized festival vs open screening' },
        { activity: 'Musical theater lead in competitive program with regional recognition', scoreRange: [7, 8.5], context: 'Lead role in program recognized beyond school (regional festivals, awards)', subcategory: 'theater_acting', fieldPrestige: 2, keyDifferentiator: 'Program with external recognition vs school-only productions' },
        { activity: 'A cappella group leader (ICHSA competition finalist)', scoreRange: [7, 8], context: 'Led competitive a cappella group with external results', selectivityRatio: 'ICHSA: ~150 groups compete nationally', subcategory: 'vocal', fieldPrestige: 2, keyDifferentiator: 'Competition finalist vs school performances only' },
        { activity: 'Original composition performed by school/community ensemble', scoreRange: [7, 8], context: 'Composition selected and performed shows creative mastery', subcategory: 'instrumental_classical', fieldPrestige: 2, keyDifferentiator: 'Original composition performed vs arranged vs interpreted' },
        { activity: 'All-State jazz ensemble selection', scoreRange: [7, 8], context: 'State-level jazz recognition (improvisation + technique)', subcategory: 'instrumental_jazz', fieldPrestige: 2, keyDifferentiator: 'All-State jazz vs All-County; improvisation evaluated' },
      ],
      3: [
        { activity: 'All-County/Regional honors ensemble', scoreRange: [5.5, 6.5], context: 'Good but significantly more common than All-State', subcategory: 'instrumental_classical', fieldPrestige: 3, keyDifferentiator: 'County/regional vs state-level selection' },
        { activity: 'Supporting role in school productions', scoreRange: [5.5, 6], context: 'Active participant but not featured performer', subcategory: 'theater_acting', fieldPrestige: 3, keyDifferentiator: 'Named supporting role vs chorus/ensemble' },
        { activity: 'Local dance competition awards', scoreRange: [5.5, 6], context: 'Competition participation shows dedication', subcategory: 'dance', fieldPrestige: 3, keyDifferentiator: 'Competition vs recital performance' },
        { activity: 'School musical lead (non-competitive program)', scoreRange: [5.5, 6.5], context: 'Lead role in school with standard theater program', subcategory: 'theater_acting', fieldPrestige: 3, keyDifferentiator: 'Non-competitive program lead vs competitive program lead' },
        { activity: 'Drum major / marching band section leader', scoreRange: [5.5, 6.5], context: 'Student conductor or section leader in marching band', subcategory: 'instrumental_classical', fieldPrestige: 3, keyDifferentiator: 'Drum major vs section leader vs member' },
        { activity: 'Private lesson student with recital performances (5+ years)', scoreRange: [5.5, 6], context: 'Sustained dedicated instrument study with public performance', subcategory: 'instrumental_classical', fieldPrestige: 3, keyDifferentiator: '5+ years of lessons with recitals vs casual practice' },
        { activity: 'A cappella group member (regular performances)', scoreRange: [5.5, 6], context: 'Active member of performing a cappella group', subcategory: 'vocal', fieldPrestige: 3, keyDifferentiator: 'Performing group vs casual singing' },
        { activity: 'Community theater lead role', scoreRange: [5.5, 6.5], context: 'Cast in lead through open audition beyond school', subcategory: 'theater_acting', fieldPrestige: 3, keyDifferentiator: 'Community theater (open audition) vs school theater' },
      ],
      4: [
        { activity: 'School ensemble member (no selection/audition)', scoreRange: [4, 5], context: 'Participation-based with no competitive distinction', subcategory: 'instrumental_classical', fieldPrestige: 4, keyDifferentiator: 'Non-auditioned vs auditioned ensemble' },
        { activity: 'School play ensemble/chorus', scoreRange: [4, 4.5], context: 'Participation without featured role', subcategory: 'theater_acting', fieldPrestige: 4, keyDifferentiator: 'Ensemble cast member without lines' },
        { activity: 'Marching band member', scoreRange: [4, 5], context: 'Regular marching band participation', subcategory: 'instrumental_classical', fieldPrestige: 4, keyDifferentiator: 'Marching band member vs section leader vs drum major' },
        { activity: 'School choir member (non-auditioned)', scoreRange: [4, 4.5], context: 'Participating in school choir without audition', subcategory: 'vocal', fieldPrestige: 4, keyDifferentiator: 'Non-auditioned choir vs auditioned; vs All-County' },
        { activity: 'Dance recital participant (studio performances)', scoreRange: [4, 5], context: 'Annual recital at dance studio', subcategory: 'dance', fieldPrestige: 4, keyDifferentiator: 'Studio recital vs competition vs professional company' },
      ],
      5: [
        { activity: 'Beginner music lessons (< 2 years)', scoreRange: [2.5, 3.5], context: 'Early-stage instrument learning', subcategory: 'instrumental_classical', fieldPrestige: 5, keyDifferentiator: '< 2 years lessons vs 5+ years vs competition performer' },
      ],
    },
  },

  // ========================================================================
  // 5. ATHLETICS
  // ========================================================================
  athletics: {
    label: 'Athletics & Sports',
    keywords: ['sport', 'team', 'varsity', 'captain', 'athlete', 'soccer', 'basketball', 'football', 'tennis', 'swimming', 'track', 'cross country', 'baseball', 'volleyball', 'lacrosse', 'hockey', 'wrestling', 'rowing', 'fencing', 'martial arts', 'esports'],
    subcategories: [
      { key: 'individual_olympic', name: 'Individual Olympic Sports', prestigeLevel: 1, prestigeContext: 'Individual results are unambiguous measures of ability', typicalTier: 3, keywords: ['swimming', 'track', 'tennis', 'wrestling', 'fencing', 'rowing', 'gymnastics', 'individual'] },
      { key: 'team_sport', name: 'Team Sports', prestigeLevel: 2, prestigeContext: 'Team context makes individual contribution harder to assess', typicalTier: 4, keywords: ['soccer', 'basketball', 'football', 'volleyball', 'lacrosse', 'hockey', 'baseball', 'softball'] },
      { key: 'club_sport', name: 'Club/Travel Sports', prestigeLevel: 2, prestigeContext: 'Travel teams show commitment; results vary', typicalTier: 4, keywords: ['club', 'travel', 'aau', 'select', 'premier'] },
      { key: 'martial_arts', name: 'Martial Arts', prestigeLevel: 3, prestigeContext: 'Belt rankings provide clear progression; competition adds value', typicalTier: 4, keywords: ['martial arts', 'karate', 'taekwondo', 'judo', 'black belt', 'bjj'] },
      { key: 'esports', name: 'Esports', prestigeLevel: 4, prestigeContext: 'Emerging recognition; scholarships available', typicalTier: 5, keywords: ['esports', 'gaming', 'league of legends', 'valorant', 'overwatch'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'JV or recreational participation', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Varsity starter, local competition success', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'All-Conference/All-District, state qualifier, team captain', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Recruited D1, state champion, national team member', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Captain / Team Leader', scoreModifier: 0.5, context: 'Selected by coach/team for leadership' },
      { role: 'Varsity Starter', scoreModifier: 0.0, context: 'Regular contributor to team' },
      { role: 'Varsity Roster', scoreModifier: -0.2, context: 'On team but not regular starter' },
      { role: 'JV Player', scoreModifier: -0.5, context: 'Junior varsity level' },
    ],
    tiers: {
      1: [
        { activity: 'D1 recruited athlete (Power 5 conference)', scoreRange: [9.5, 10], context: 'Recruited to play at highest level of college athletics', subcategory: 'team_sport', fieldPrestige: 1, keyDifferentiator: 'Power 5 D1 vs mid-major D1 vs D2/D3' },
        { activity: 'National team member / Olympic Trials qualifier', scoreRange: [9.5, 10], context: 'Representing country in international competition', subcategory: 'individual_olympic', fieldPrestige: 1, keyDifferentiator: 'National team vs national championship participant' },
        { activity: 'State champion (competitive sport, large state)', scoreRange: [9, 10], context: 'Top athlete in state; varies by sport/state size', subcategory: 'individual_olympic', fieldPrestige: 1, keyDifferentiator: 'Large state (CA/TX/NY) vs small state' },
      ],
      2: [
        { activity: 'All-State selection (varsity sport)', scoreRange: [7.5, 8.5], context: 'Top ~50 athletes statewide in their position/event', subcategory: 'team_sport', fieldPrestige: 2, keyDifferentiator: 'All-State vs All-Conference' },
        { activity: 'D1 recruited athlete (mid-major)', scoreRange: [7.5, 8.5], context: 'Recruited at division 1 level', subcategory: 'individual_olympic', fieldPrestige: 2, keyDifferentiator: 'D1 mid-major vs D2/D3/NAIA' },
        { activity: 'D2 recruited athlete (athletic scholarship)', scoreRange: [7, 8], context: 'D2 scholarship validates competitive level; strong academics + athletics', subcategory: 'team_sport', fieldPrestige: 2, keyDifferentiator: 'D2 scholarship vs D3 (no athletic scholarships); recruited vs walk-on' },
        { activity: 'State meet qualifier with top-10 finish', scoreRange: [7, 8], context: 'Competing and placing well at state level', subcategory: 'individual_olympic', fieldPrestige: 2, keyDifferentiator: 'Top-10 finish vs participation' },
        { activity: 'National-level martial arts competitor (black belt)', scoreRange: [7, 8], context: 'Competition at national level shows elite commitment', subcategory: 'martial_arts', fieldPrestige: 2, keyDifferentiator: 'National competition vs local tournaments' },
        { activity: 'National rowing/fencing championship team member', scoreRange: [7, 8.5], context: 'National-level competition in niche sport with college pathway', subcategory: 'individual_olympic', fieldPrestige: 2, keyDifferentiator: 'National championship team vs local club; rowing/fencing have strong college recruiting' },
        { activity: 'Walk-on at D1 program (made roster through tryout)', scoreRange: [7, 8], context: 'Earned roster spot without recruitment; demonstrates extreme determination', subcategory: 'team_sport', fieldPrestige: 2, keyDifferentiator: 'Made D1 roster via tryout vs recruited; walk-on vs cut' },
        { activity: 'Esports scholarship at collegiate level', scoreRange: [6.5, 7.5], context: 'Collegiate esports scholarship validates competitive gaming; emerging but not yet mainstream', subcategory: 'esports', fieldPrestige: 2, keyDifferentiator: 'Scholarship offer vs ranked play vs casual; institutional recognition' },
      ],
      3: [
        { activity: 'All-Conference/All-District (varsity captain)', scoreRange: [5.5, 6.5], context: 'Strong school-level athlete with regional recognition', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Conference vs district vs league recognition' },
        { activity: 'Varsity starter (3+ years)', scoreRange: [5.5, 6], context: 'Sustained varsity commitment shows discipline', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Multi-year starter vs single season' },
        { activity: 'Black belt earned (competitive martial arts)', scoreRange: [5.5, 6.5], context: 'Demonstrating years of dedicated training', subcategory: 'martial_arts', fieldPrestige: 3, keyDifferentiator: 'Competitive sparring vs forms-only testing' },
        { activity: 'D3/NAIA committed athlete', scoreRange: [5.5, 6.5], context: 'Playing collegiately without athletic scholarship; academics + sport', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'D3 committed vs varsity captain without college play; no athletic scholarship at D3' },
        { activity: 'Club/travel team with national ranking or tournament', scoreRange: [5.5, 6.5], context: 'Travel team competing at recognized national-level tournaments', subcategory: 'club_sport', fieldPrestige: 3, keyDifferentiator: 'Nationally ranked club team vs local travel; AAU/ECNL/MLS Next' },
        { activity: 'Multi-sport varsity captain (2+ sports)', scoreRange: [5.5, 6.5], context: 'Captaining multiple varsity teams shows broad athletic leadership', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Multi-sport captain vs single sport; leadership across seasons' },
        { activity: 'Youth coaching/refereeing (certified, 100+ hours)', scoreRange: [5.5, 6], context: 'Giving back to sport by coaching younger athletes; certified by governing body', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Certified coach/ref with 100+ hours vs occasional help; leadership dimension' },
        { activity: 'Special Olympics athlete or Unified Sports partner', scoreRange: [5.5, 6.5], context: 'Athletic competition or partnership supporting athletes with intellectual disabilities', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Competition athlete vs Unified partner vs volunteer; sustained commitment + inclusion' },
        { activity: 'State qualifier (individual sport, did not place)', scoreRange: [5.5, 6], context: 'Qualified for state championship but did not medal', subcategory: 'individual_olympic', fieldPrestige: 3, keyDifferentiator: 'State qualifier vs sectional only; qualified without placing' },
      ],
      4: [
        { activity: 'Varsity team member (1-2 years)', scoreRange: [4, 5], context: 'Participation shows commitment but limited distinction', subcategory: 'team_sport', fieldPrestige: 4, keyDifferentiator: 'Varsity vs JV distinction' },
        { activity: 'Club/travel team member (local level)', scoreRange: [4, 5], context: 'Travel teams are common; results matter', subcategory: 'club_sport', fieldPrestige: 4, keyDifferentiator: 'Travel team with wins vs participation only; local vs national' },
        { activity: 'Intramural/recreational league participant', scoreRange: [4, 4.5], context: 'Organized sports without competitive selection', subcategory: 'team_sport', fieldPrestige: 4, keyDifferentiator: 'Recreational league vs varsity tryout; participation vs competition' },
        { activity: 'Martial arts student (no competition, working toward belt)', scoreRange: [4, 5], context: 'Dedicated training without competitive validation', subcategory: 'martial_arts', fieldPrestige: 4, keyDifferentiator: 'Training toward belt vs earned black belt vs competition' },
        { activity: 'Youth coaching volunteer (informal, <50 hours)', scoreRange: [4, 4.5], context: 'Occasional coaching help without formal certification', subcategory: 'team_sport', fieldPrestige: 4, keyDifferentiator: 'Informal helping vs certified coaching vs 100+ hours' },
      ],
      5: [
        { activity: 'JV or recreational team member (single season)', scoreRange: [2.5, 3.5], context: 'Shows interest but no competitive distinction', subcategory: 'team_sport', fieldPrestige: 5, keyDifferentiator: 'JV single season is expected, not distinguishing' },
        { activity: 'Casual esports participation (no ranked results)', scoreRange: [2.5, 3], context: 'Without scholarship-level competitive results', subcategory: 'esports', fieldPrestige: 5, keyDifferentiator: 'Ranked play vs casual gaming' },
        { activity: 'Personal fitness/gym membership only', scoreRange: [2, 3], context: 'Individual fitness without team or competitive context', subcategory: 'individual_olympic', fieldPrestige: 5, keyDifferentiator: 'Personal fitness vs organized sport' },
      ],
    },
  },

  // ========================================================================
  // 6. COMMUNITY SERVICE
  // ========================================================================
  community_service: {
    label: 'Community Service & Volunteering',
    keywords: ['volunteer', 'service', 'community', 'nonprofit', 'charity', 'food bank', 'tutoring', 'mentoring', 'shelter', 'habitat', 'hospital', 'red cross'],
    subcategories: [
      { key: 'program_creation', name: 'Program/Organization Creation', prestigeLevel: 1, prestigeContext: 'Creating lasting impact infrastructure is most valued', typicalTier: 3, keywords: ['founded', 'created', 'started', 'established', 'nonprofit', 'organization'] },
      { key: 'direct_service', name: 'Direct Service', prestigeLevel: 2, prestigeContext: 'Hands-on work with clear beneficiaries', typicalTier: 4, keywords: ['volunteer', 'tutoring', 'mentoring', 'food bank', 'shelter', 'habitat'] },
      { key: 'fundraising', name: 'Fundraising', prestigeLevel: 3, prestigeContext: 'Amount raised and sustained effort differentiate', typicalTier: 4, keywords: ['fundraising', 'raised', 'donation', 'gala', 'campaign'] },
      { key: 'advocacy', name: 'Advocacy & Awareness', prestigeLevel: 2, prestigeContext: 'Policy impact and reach distinguish from awareness alone', typicalTier: 4, keywords: ['advocacy', 'awareness', 'campaign', 'policy', 'petition', 'testimony'] },
      { key: 'mentoring', name: 'Mentoring & Teaching', prestigeLevel: 2, prestigeContext: 'Sustained mentoring with measurable outcomes valued', typicalTier: 4, keywords: ['mentor', 'tutor', 'teach', 'coach', 'youth'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'One-time or mandatory service events', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Regular volunteering with some responsibility', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Founded program, leadership role, measurable community impact', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Scaled organization, policy change, national recognition', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Founder / Executive Director', scoreModifier: 1.0, context: 'Created and sustained an organization from scratch' },
      { role: 'Program Leader / Coordinator', scoreModifier: 0.5, context: 'Manages volunteers and program logistics' },
      { role: 'Regular Volunteer (leadership track)', scoreModifier: 0.0, context: 'Consistent presence with growing responsibility' },
      { role: 'Occasional Volunteer', scoreModifier: -0.5, context: 'Sporadic participation without commitment arc' },
    ],
    tiers: {
      1: [
        { activity: 'Founded nonprofit with 501(c)(3) status serving 1000+ people', scoreRange: [9, 10], context: 'Legal nonprofit formation and sustained operation is exceptional', subcategory: 'program_creation', fieldPrestige: 1, keyDifferentiator: 'Legal entity vs informal school club; sustained vs one-time' },
        { activity: 'Testimony before state legislature / policy change achieved', scoreRange: [9, 10], context: 'Actual policy impact from youth advocacy', subcategory: 'advocacy', fieldPrestige: 1, keyDifferentiator: 'Achieved policy change vs attended rally' },
        { activity: 'Founded sustainable nonprofit with national expansion', scoreRange: [9.5, 10], context: 'Service organization expanded beyond original community', subcategory: 'program_creation', fieldPrestige: 1, keyDifferentiator: 'National expansion vs single-community; sustained vs one-time' },
      ],
      2: [
        { activity: 'Founded sustainable community program (100+ beneficiaries)', scoreRange: [7, 8.5], context: 'Program continues beyond personal involvement', subcategory: 'program_creation', fieldPrestige: 2, keyDifferentiator: 'Sustainable program vs one-time event' },
        { activity: 'Led fundraising campaign raising $10,000+', scoreRange: [7, 8], context: 'Significant fundraising with clear allocation', subcategory: 'fundraising', fieldPrestige: 2, keyDifferentiator: '$10K+ vs $1K vs $100 raised' },
        { activity: 'Multi-year mentoring with documented student improvement', scoreRange: [7, 8], context: 'Sustained mentoring with measurable outcomes', subcategory: 'mentoring', fieldPrestige: 2, keyDifferentiator: 'Documented outcomes vs hours logged' },
        { activity: 'Crisis hotline volunteer (100+ hours, certified)', scoreRange: [7, 8], context: 'Trained crisis intervention with real people in distress', subcategory: 'mentoring', fieldPrestige: 1, keyDifferentiator: 'Certified crisis work vs awareness; 100+ hours vs training only' },
        { activity: 'International service project with sustained local partnership', scoreRange: [7, 8.5], context: 'Service abroad with ongoing relationship, not voluntourism', subcategory: 'direct_service', fieldPrestige: 2, keyDifferentiator: 'Sustained partnership vs one-week trip' },
        { activity: 'Disaster relief coordinator (organized response for 50+)', scoreRange: [7, 8], context: 'Coordinated community response during crisis', subcategory: 'program_creation', fieldPrestige: 2, keyDifferentiator: 'Coordinated response vs donated goods' },
        { activity: 'Eagle Scout / Girl Scout Gold Award', scoreRange: [7, 8.5], context: 'Requires sustained leadership and community service project; ~6% of Boy Scouts earn Eagle', selectivityRatio: 'Eagle Scout: ~6% of all Scouts; Gold Award: ~5.4% of Girl Scouts', subcategory: 'program_creation', fieldPrestige: 2, keyDifferentiator: 'Eagle/Gold project with community impact vs rank completion; project scope and lasting impact matter' },
      ],
      3: [
        { activity: 'Regular volunteer at established organization (200+ hours)', scoreRange: [5.5, 6.5], context: 'Commitment to existing program with growing responsibility', subcategory: 'direct_service', fieldPrestige: 3, keyDifferentiator: '200+ hours vs minimum required hours' },
        { activity: 'Organized school service event (50+ participants)', scoreRange: [5.5, 6.5], context: 'One-time event organization shows initiative', subcategory: 'program_creation', fieldPrestige: 3, keyDifferentiator: 'Organized vs participated in event' },
        { activity: 'Peer tutoring program leader (20+ students served)', scoreRange: [5.5, 6.5], context: 'Created or led structured tutoring with documented impact', subcategory: 'mentoring', fieldPrestige: 3, keyDifferentiator: 'Program leader vs individual tutor; documented outcomes' },
        { activity: 'Habitat for Humanity regular builder (100+ hours)', scoreRange: [5.5, 6], context: 'Sustained physical service with tangible outcomes', subcategory: 'direct_service', fieldPrestige: 3, keyDifferentiator: '100+ hours regular builder vs one-day event' },
        { activity: 'Pro bono skill-based service (web design, translation for nonprofit)', scoreRange: [5.5, 6.5], context: 'Applying professional skills to serve community', subcategory: 'direct_service', fieldPrestige: 3, keyDifferentiator: 'Skilled service vs general labor; specific deliverable' },
        { activity: 'Fundraising campaign ($1K-10K raised)', scoreRange: [5.5, 6.5], context: 'Organized fundraising with moderate but real results', subcategory: 'fundraising', fieldPrestige: 3, keyDifferentiator: '$1K-10K vs $100 vs $10K+' },
        { activity: 'Key Club / Interact / Leo Club officer with project leadership', scoreRange: [5.5, 6.5], context: 'Chapter-level officer leading service projects for established org', subcategory: 'program_creation', fieldPrestige: 3, keyDifferentiator: 'Officer with projects vs member; established org provides structure but limits innovation credit' },
        { activity: 'Lifeguard (certified, 2+ seasons, with rescue experience)', scoreRange: [5.5, 6], context: 'Certified lifeguard with sustained commitment and real responsibility', subcategory: 'direct_service', fieldPrestige: 3, keyDifferentiator: 'Certified with rescues vs seasonal employment; responsibility for safety' },
      ],
      4: [
        { activity: 'Regular volunteer (50-100 hours/year)', scoreRange: [4, 5], context: 'Consistent but not distinguished by impact or leadership', subcategory: 'direct_service', fieldPrestige: 4, keyDifferentiator: 'Regular schedule vs sporadic attendance' },
        { activity: 'NHS / service club required hours', scoreRange: [4, 4.5], context: 'Meeting minimum requirements for honor society', subcategory: 'direct_service', fieldPrestige: 4, keyDifferentiator: 'Required minimum vs voluntary excess' },
        { activity: 'One-time fundraiser event participant', scoreRange: [4, 5], context: 'Participated in fundraising event organized by others', subcategory: 'fundraising', fieldPrestige: 4, keyDifferentiator: 'Participated vs organized; one-time vs recurring' },
        { activity: 'Holiday gift drive / seasonal food drive organizer', scoreRange: [4, 5], context: 'Seasonal service activity with limited year-round commitment', subcategory: 'direct_service', fieldPrestige: 4, keyDifferentiator: 'Seasonal organizer vs year-round commitment' },
      ],
      5: [
        { activity: 'One-time service event participation', scoreRange: [2.5, 3.5], context: 'Single event without sustained commitment', subcategory: 'direct_service', fieldPrestige: 5, keyDifferentiator: 'One-time vs regular vs founding' },
        { activity: 'Donated money only (no time investment)', scoreRange: [2.5, 3], context: 'Financial contribution without personal engagement', subcategory: 'fundraising', fieldPrestige: 5, keyDifferentiator: 'Financial donation vs time commitment' },
        { activity: 'Court-ordered community service', scoreRange: [2.5, 3.5], context: 'Mandatory service; not voluntary and AOs note the difference', subcategory: 'direct_service', fieldPrestige: 5, keyDifferentiator: 'Court-ordered vs voluntary; no initiative demonstrated' },
      ],
    },
  },

  // ========================================================================
  // 7. ENTREPRENEURSHIP
  // ========================================================================
  entrepreneurship: {
    label: 'Entrepreneurship & Business',
    keywords: ['startup', 'business', 'entrepreneur', 'company', 'revenue', 'customers', 'app', 'product', 'launch', 'deca', 'fbla', 'business plan'],
    subcategories: [
      { key: 'tech_startup', name: 'Tech Startup', prestigeLevel: 1, prestigeContext: 'Revenue-generating tech ventures most impressive', typicalTier: 3, keywords: ['app', 'software', 'saas', 'tech', 'platform', 'website', 'startup'] },
      { key: 'social_enterprise', name: 'Social Enterprise', prestigeLevel: 1, prestigeContext: 'Mission-driven business shows character + skill', typicalTier: 3, keywords: ['social enterprise', 'impact', 'mission', 'b-corp'] },
      { key: 'small_business', name: 'Small Business', prestigeLevel: 3, prestigeContext: 'Revenue and scale differentiate from hobby', typicalTier: 4, keywords: ['business', 'sell', 'customers', 'revenue', 'etsy', 'shopify'] },
      { key: 'business_competition', name: 'Business Competitions', prestigeLevel: 2, prestigeContext: 'DECA/FBLA nationals provide clear benchmarks', typicalTier: 4, keywords: ['deca', 'fbla', 'business plan', 'competition', 'pitch'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Business club member, no launched ventures', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Small business or project with some revenue/users', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Sustained business with real revenue, or DECA/FBLA state winner', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'VC-backed startup, significant revenue, national competition winner', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Founder / CEO', scoreModifier: 1.0, context: 'Built and ran the venture' },
      { role: 'Co-Founder / CTO', scoreModifier: 0.7, context: 'Key partner in building the venture' },
      { role: 'Employee / Intern', scoreModifier: -0.3, context: 'Working in someone else\'s venture' },
      { role: 'Business club member', scoreModifier: -0.7, context: 'No actual venture experience' },
    ],
    tiers: {
      1: [
        { activity: 'VC-backed startup or accelerator graduate (YC, Thiel Fellowship finalist)', scoreRange: [9.5, 10], context: 'External validation through top-tier investment/accelerator', selectivityRatio: 'YC: ~1.5% acceptance; Thiel: ~20 of 3,000+', subcategory: 'tech_startup', fieldPrestige: 1, keyDifferentiator: 'Top accelerator/VC vs angel investment vs bootstrapped' },
        { activity: 'Revenue-generating business ($50K+/year)', scoreRange: [9, 10], context: 'Substantial revenue demonstrates real market validation', subcategory: 'tech_startup', fieldPrestige: 1, keyDifferentiator: '$50K+ revenue vs $10K vs $1K' },
        { activity: 'DECA/FBLA National Champion', scoreRange: [9, 10], context: 'Top competitor at national business competition', selectivityRatio: '~1 of 200,000+ DECA members', subcategory: 'business_competition', fieldPrestige: 1, keyDifferentiator: 'National champion vs state champion' },
      ],
      2: [
        { activity: 'SaaS/platform with $1K-10K monthly recurring revenue', scoreRange: [7.5, 8.5], context: 'Recurring revenue from paying subscribers demonstrates sustainable business', subcategory: 'tech_startup', fieldPrestige: 1, keyDifferentiator: 'MRR vs one-time sales; recurring shows retention' },
        { activity: 'Launched product/service with paying customers (50+)', scoreRange: [7, 8.5], context: 'Real customers validate product-market fit', subcategory: 'tech_startup', fieldPrestige: 2, keyDifferentiator: 'Paying customers vs free users vs no users' },
        { activity: 'Social enterprise serving 200+ beneficiaries', scoreRange: [7, 8], context: 'Mission-driven with measurable community impact', subcategory: 'social_enterprise', fieldPrestige: 2, keyDifferentiator: 'Sustained impact vs one-time drive' },
        { activity: 'DECA/FBLA State Champion (advancing to nationals)', scoreRange: [7, 8], context: 'State-level business competition success', subcategory: 'business_competition', fieldPrestige: 2, keyDifferentiator: 'State champion vs qualifier' },
        { activity: 'Won national-level pitch competition (not DECA)', scoreRange: [7, 8.5], context: 'Pitch competitions like Diamond Challenge, Conrad Challenge provide external validation', subcategory: 'business_competition', fieldPrestige: 2, keyDifferentiator: 'National competition win vs local pitch night' },
        { activity: 'BPA (Business Professionals of America) national finalist', scoreRange: [7, 8], context: 'National finalist in BPA business competition', selectivityRatio: '~6,000 compete at nationals from 42,000+ members', subcategory: 'business_competition', fieldPrestige: 2, keyDifferentiator: 'National finalist vs state competitor vs chapter member' },
        { activity: 'Kickstarter/crowdfunded hardware product successfully funded', scoreRange: [7, 8], context: 'Public crowdfunding proves market demand for physical product', subcategory: 'tech_startup', fieldPrestige: 2, keyDifferentiator: 'Funded and delivered vs funded and abandoned vs not funded' },
      ],
      3: [
        { activity: 'E-commerce business with steady sales ($500-5K total)', scoreRange: [5.5, 6.5], context: 'Consistent online sales showing business operations skills', subcategory: 'small_business', fieldPrestige: 3, keyDifferentiator: 'Steady sales vs one-time burst; $500+ vs under $100' },
        { activity: 'Freelance business with 5+ recurring clients', scoreRange: [5.5, 6.5], context: 'Clients returning shows quality of service delivery', subcategory: 'small_business', fieldPrestige: 3, keyDifferentiator: 'Recurring clients vs one-off gigs; 5+ clients vs 1' },
        { activity: 'DECA/FBLA regional competitor', scoreRange: [5.5, 6], context: 'Active participation in business competitions', subcategory: 'business_competition', fieldPrestige: 3, keyDifferentiator: 'Regional placement vs participation' },
        { activity: 'App with 100+ downloads (free)', scoreRange: [5.5, 6], context: 'Built and published app; some adoption', subcategory: 'tech_startup', fieldPrestige: 3, keyDifferentiator: '100+ downloads vs published with none; free vs paid' },
        { activity: 'Small business with some revenue (<$500)', scoreRange: [5.5, 6], context: 'Demonstrates initiative even if scale is very modest', subcategory: 'small_business', fieldPrestige: 3, keyDifferentiator: 'Any revenue vs ideas only; operated vs planned' },
        { activity: 'DECA district winner (not advancing to state)', scoreRange: [5.5, 6], context: 'District-level recognition in business competition', subcategory: 'business_competition', fieldPrestige: 3, keyDifferentiator: 'District winner vs participant' },
      ],
      4: [
        { activity: 'Business club officer without venture', scoreRange: [4, 5], context: 'Leadership in club but no hands-on entrepreneurship', subcategory: 'business_competition', fieldPrestige: 4, keyDifferentiator: 'Club leadership vs actual business' },
        { activity: 'Business idea/plan without execution', scoreRange: [4, 4.5], context: 'Ideas without execution show interest but not ability', subcategory: 'tech_startup', fieldPrestige: 5, keyDifferentiator: 'Executed vs planned vs imagined' },
        { activity: 'Etsy/marketplace seller with occasional sales', scoreRange: [4, 5], context: 'Selling creative products online; minimal scale', subcategory: 'small_business', fieldPrestige: 4, keyDifferentiator: 'Active sales vs listed without buyers' },
        { activity: 'Lemonade stand / seasonal popup / bake sale', scoreRange: [4, 4.5], context: 'Small-scale temporary commercial activity', subcategory: 'small_business', fieldPrestige: 5, keyDifferentiator: 'Seasonal/temporary vs sustained business' },
      ],
      5: [
        { activity: 'DECA/FBLA member (no competitions entered)', scoreRange: [2.5, 3.5], context: 'Club membership without competitive engagement', subcategory: 'business_competition', fieldPrestige: 5, keyDifferentiator: 'Club member vs competitor vs winner' },
        { activity: 'Business class project only', scoreRange: [2.5, 3.5], context: 'Academic exercise without real-world application', subcategory: 'small_business', fieldPrestige: 5, keyDifferentiator: 'Class project vs real business' },
      ],
    },
  },

  // ========================================================================
  // 8. TECHNOLOGY
  // ========================================================================
  technology: {
    label: 'Technology & Software',
    keywords: ['software', 'coding', 'programming', 'web', 'app', 'developer', 'github', 'open source', 'robotics', 'cybersecurity', 'ai', 'machine learning', 'hardware'],
    subcategories: [
      { key: 'software_dev', name: 'Software Development', prestigeLevel: 2, prestigeContext: 'Real users/impact differentiate from tutorial projects', typicalTier: 4, keywords: ['software', 'app', 'web', 'fullstack', 'backend', 'frontend', 'developer'] },
      { key: 'open_source', name: 'Open Source Contribution', prestigeLevel: 1, prestigeContext: 'Accepted PRs to major projects signal real skill', typicalTier: 3, keywords: ['open source', 'github', 'contributor', 'pull request', 'maintainer'] },
      { key: 'robotics', name: 'Robotics', prestigeLevel: 2, prestigeContext: 'FRC competition results provide clear benchmarks', typicalTier: 4, keywords: ['robotics', 'frc', 'ftc', 'vex', 'robot', 'first'] },
      { key: 'cybersecurity', name: 'Cybersecurity', prestigeLevel: 2, prestigeContext: 'CTF competitions and bug bounties provide validation', typicalTier: 4, keywords: ['cybersecurity', 'ctf', 'security', 'bug bounty', 'penetration testing'] },
      { key: 'ai_ml', name: 'AI/Machine Learning', prestigeLevel: 1, prestigeContext: 'Novel applications with measurable results valued', typicalTier: 3, keywords: ['ai', 'machine learning', 'deep learning', 'neural network', 'nlp', 'computer vision'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Learning to code, tutorial projects, coding club member', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Personal projects with some users, FRC team member', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Apps with 1000+ users, major OS contributions, FRC Dean\'s List', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Widely-used tools, accepted to major OS projects, national robotics awards', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Creator / Lead Developer', scoreModifier: 0.7, context: 'Built the primary product/system' },
      { role: 'Team Lead / Drive Team', scoreModifier: 0.3, context: 'Led technical team on shared project' },
      { role: 'Contributor', scoreModifier: 0.0, context: 'Meaningful technical contribution' },
      { role: 'Member / Participant', scoreModifier: -0.5, context: 'On team without clear technical contribution' },
    ],
    tiers: {
      1: [
        { activity: 'Open source tool with 1000+ GitHub stars', scoreRange: [9, 10], context: 'Thousands of developers using your tool', subcategory: 'open_source', fieldPrestige: 1, keyDifferentiator: '1000+ stars vs 100 stars vs personal project' },
        { activity: 'App/platform with 10,000+ active users', scoreRange: [9, 10], context: 'Real product-market fit at scale', subcategory: 'software_dev', fieldPrestige: 1, keyDifferentiator: 'Active users vs downloads vs no users' },
        { activity: 'FRC Dean\'s List Finalist (national)', scoreRange: [9, 10], context: 'Top student leader across all FRC teams nationally', selectivityRatio: '10 of ~87,000 participants', subcategory: 'robotics', fieldPrestige: 1, keyDifferentiator: 'National finalist vs semi-finalist vs regional' },
        { activity: 'Bug bounty on major company (Google/Microsoft/Apple CVE)', scoreRange: [9, 10], context: 'Credited security vulnerability discovery at Fortune 500 company', subcategory: 'cybersecurity', fieldPrestige: 1, keyDifferentiator: 'Major company CVE vs small-scope bug vs CTF win' },
        { activity: 'National hackathon grand prize (HackMIT, PennApps, TreeHacks)', scoreRange: [9, 10], context: 'Top project among 1,000+ collegiate-level hackers', selectivityRatio: '1-3 grand prizes from 1,000+ participants', subcategory: 'software_dev', fieldPrestige: 1, keyDifferentiator: 'Grand prize at top hackathon vs minor prize vs attendance' },
      ],
      2: [
        { activity: 'Published app/tool with 500+ users', scoreRange: [7, 8.5], context: 'Real users validate technical and product skill', subcategory: 'software_dev', fieldPrestige: 2, keyDifferentiator: '500+ users vs concept vs no deployment' },
        { activity: 'Accepted PR to major open source project', scoreRange: [7, 8.5], context: 'Code review by professional developers', subcategory: 'open_source', fieldPrestige: 1, keyDifferentiator: 'Major project (React, Linux) vs small library' },
        { activity: 'FRC team technical lead (regional award winner)', scoreRange: [7, 8], context: 'Led engineering on competitive robot', subcategory: 'robotics', fieldPrestige: 2, keyDifferentiator: 'Technical lead with award vs team member' },
        { activity: 'CTF national competition placement (top 10)', scoreRange: [7, 8], context: 'Top finisher in cybersecurity competition', subcategory: 'cybersecurity', fieldPrestige: 2, keyDifferentiator: 'National placement vs participation' },
        { activity: 'FTC Inspire Award (regional/state winner)', scoreRange: [7, 8], context: 'FTC\'s top team award combining robot performance + outreach + engineering', subcategory: 'robotics', fieldPrestige: 2, keyDifferentiator: 'Inspire Award (holistic) vs Connect/Think awards; FTC vs FRC' },
        { activity: 'VEX Robotics World Championship qualifier', scoreRange: [7, 8], context: 'Top VEX teams from region qualify for worlds', selectivityRatio: '~800 teams of 20,000+ worldwide', subcategory: 'robotics', fieldPrestige: 2, keyDifferentiator: 'World qualifier vs state/regional only' },
        { activity: 'Technical blog/YouTube with 10K+ followers', scoreRange: [7, 8], context: 'Sustained technical content creation with engaged audience', subcategory: 'software_dev', fieldPrestige: 2, keyDifferentiator: '10K+ technical followers vs 100; engaged audience vs vanity metrics' },
        { activity: 'Bug bounty program payouts ($1K+ total)', scoreRange: [7, 8], context: 'Verified security findings through responsible disclosure', subcategory: 'cybersecurity', fieldPrestige: 2, keyDifferentiator: 'Paid bounties vs CTF wins vs self-study' },
        { activity: 'AI/ML project winning regional competition or with published results', scoreRange: [7, 8.5], context: 'Applied ML with external validation through competition or publication', subcategory: 'ai_ml', fieldPrestige: 1, keyDifferentiator: 'External validation vs personal project; competition win vs participation' },
        { activity: 'CyberPatriot national finalist team', scoreRange: [7, 8], context: 'Top cybersecurity team at Air Force-sponsored national competition', selectivityRatio: 'National finals: ~28 teams from 5,000+', subcategory: 'cybersecurity', fieldPrestige: 2, keyDifferentiator: 'National finalist vs state winner vs participant' },
        { activity: 'Congressional App Challenge winner', scoreRange: [7, 8], context: 'Won congressional district app competition; displayed in U.S. Capitol', subcategory: 'software_dev', fieldPrestige: 2, keyDifferentiator: 'District winner displayed in Capitol vs participant; one winner per district' },
        { activity: 'Kaggle competition medal (Bronze+) or Kaggle Expert rank', scoreRange: [7, 8], context: 'Competitive data science platform with global ranking', subcategory: 'ai_ml', fieldPrestige: 2, keyDifferentiator: 'Medal/rank vs participation; Kaggle Expert requires multiple competition finishes' },
        { activity: 'Codeforces Candidate Master (1900+) / Master (2100+)', scoreRange: [7, 8.5], context: 'Top ~5% of competitive programmers; Candidate Master or above', subcategory: 'software_dev', fieldPrestige: 2, keyDifferentiator: 'CM (1900+) → Master (2100+) → International Master (2300+) → Grandmaster (2400+)' },
      ],
      3: [
        { activity: 'Personal project deployed with some users', scoreRange: [5.5, 6.5], context: 'Built and shipped a product; limited traction', subcategory: 'software_dev', fieldPrestige: 3, keyDifferentiator: 'Deployed vs GitHub-only vs tutorial' },
        { activity: 'FRC team member (contributing role)', scoreRange: [5.5, 6], context: 'Active team member with specific contributions', subcategory: 'robotics', fieldPrestige: 3, keyDifferentiator: 'Specific role vs general member' },
        { activity: 'Personal AI/ML project with novel application', scoreRange: [5.5, 6.5], context: 'Applied ML to new problem (not copied tutorial)', subcategory: 'ai_ml', fieldPrestige: 3, keyDifferentiator: 'Novel application vs replicating tutorial' },
        { activity: 'Codeforces Expert rating (1600+) or equivalent', scoreRange: [5.5, 6.5], context: 'Demonstrated algorithmic problem-solving above beginner level', subcategory: 'software_dev', fieldPrestige: 3, keyDifferentiator: 'Expert (1600+) vs Specialist (1400+) vs Newbie; rating provides clear gradient' },
        { activity: 'FTC team lead with specific engineering contributions', scoreRange: [5.5, 6], context: 'Led FTC team with documented technical role', subcategory: 'robotics', fieldPrestige: 3, keyDifferentiator: 'FTC lead vs FRC lead (FRC is larger); lead vs member' },
        { activity: 'Website/tool used by school or local organization', scoreRange: [5.5, 6.5], context: 'Real users in a known context; fills a real need', subcategory: 'software_dev', fieldPrestige: 3, keyDifferentiator: 'Used by known org vs personal project; solves real problem' },
        { activity: 'CTF team member with regional competition results', scoreRange: [5.5, 6], context: 'Active CTF competitor with regional-level results', subcategory: 'cybersecurity', fieldPrestige: 3, keyDifferentiator: 'Regional results vs national; team vs individual' },
        { activity: 'Technical blog/YouTube (1K+ followers)', scoreRange: [5.5, 6], context: 'Consistent technical content creation building audience', subcategory: 'software_dev', fieldPrestige: 3, keyDifferentiator: '1K+ followers vs 50; consistent posting vs abandoned' },
      ],
      4: [
        { activity: 'Coding club member, personal GitHub projects', scoreRange: [4, 5], context: 'Shows interest; needs deployment/users to stand out', subcategory: 'software_dev', fieldPrestige: 4, keyDifferentiator: 'Active GitHub vs empty profile' },
        { activity: 'FRC team general member', scoreRange: [4, 5], context: 'On team but without specific technical role', subcategory: 'robotics', fieldPrestige: 4, keyDifferentiator: 'General member vs specific role' },
        { activity: 'VEX/FTC team member (no specific role)', scoreRange: [4, 5], context: 'Participated in robotics without documented technical contribution', subcategory: 'robotics', fieldPrestige: 4, keyDifferentiator: 'VEX/FTC member vs FRC; member vs technical lead' },
        { activity: 'Completed online courses/bootcamp with portfolio', scoreRange: [4, 4.5], context: 'Self-directed learning; needs project outcomes to differentiate', subcategory: 'software_dev', fieldPrestige: 4, keyDifferentiator: 'Completed courses with portfolio vs started courses vs no projects' },
        { activity: 'AI/ML tutorial projects (replicated existing models)', scoreRange: [4, 4.5], context: 'Following tutorials shows interest but not creativity', subcategory: 'ai_ml', fieldPrestige: 4, keyDifferentiator: 'Tutorial replication vs novel application vs no AI experience' },
        { activity: 'Personal website/portfolio (no external users)', scoreRange: [4, 4.5], context: 'Built personal site; demonstrates basics but no impact', subcategory: 'software_dev', fieldPrestige: 4, keyDifferentiator: 'Personal site vs tool with users vs no web presence' },
      ],
      5: [
        { activity: 'Coding class participation only (no extracurricular)', scoreRange: [2.5, 3.5], context: 'AP CS or coding elective without outside projects', subcategory: 'software_dev', fieldPrestige: 5, keyDifferentiator: 'Class only vs club vs projects vs deployed product' },
        { activity: 'Installed IDE / watched coding tutorials only', scoreRange: [2, 3], context: 'Interest declared but no output produced', subcategory: 'software_dev', fieldPrestige: 5, keyDifferentiator: 'Intent without execution' },
      ],
    },
  },

  // ========================================================================
  // 9. WRITING & JOURNALISM
  // ========================================================================
  writing_journalism: {
    label: 'Writing & Journalism',
    keywords: ['writing', 'journalism', 'newspaper', 'magazine', 'blog', 'poetry', 'fiction', 'nonfiction', 'editor', 'reporter', 'literary', 'publication', 'screenwriting'],
    subcategories: [
      { key: 'journalism', name: 'Journalism', prestigeLevel: 2, prestigeContext: 'Editor-in-chief roles and awards distinguish', typicalTier: 4, keywords: ['newspaper', 'journalist', 'reporter', 'editor', 'press', 'news'] },
      { key: 'fiction', name: 'Fiction Writing', prestigeLevel: 2, prestigeContext: 'Published fiction and competition wins matter', typicalTier: 4, keywords: ['fiction', 'novel', 'short story', 'creative writing'] },
      { key: 'poetry', name: 'Poetry', prestigeLevel: 2, prestigeContext: 'Scholastic Art & Writing Awards are the benchmark', typicalTier: 4, keywords: ['poetry', 'poem', 'verse', 'spoken word'] },
      { key: 'academic_writing', name: 'Academic/Research Writing', prestigeLevel: 2, prestigeContext: 'Published essays in journals demonstrate scholarship', typicalTier: 3, keywords: ['essay', 'academic', 'thesis', 'research paper', 'journal'] },
      { key: 'screenwriting', name: 'Screenwriting', prestigeLevel: 3, prestigeContext: 'Produced scripts provide external validation', typicalTier: 4, keywords: ['screenplay', 'script', 'screenwriting', 'film writing'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'School newspaper contributor, personal blog', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Editor role, local publication, contest entries', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Editor-in-chief, Scholastic regional award, external publication', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Scholastic Gold Key national, published in major outlets, book deal', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Editor-in-Chief', scoreModifier: 0.7, context: 'Top editorial leadership of publication' },
      { role: 'Section Editor / Managing Editor', scoreModifier: 0.3, context: 'Significant editorial responsibility' },
      { role: 'Staff Writer / Reporter', scoreModifier: 0.0, context: 'Active contributor producing content' },
      { role: 'Contributor / Member', scoreModifier: -0.3, context: 'Occasional contributions' },
    ],
    tiers: {
      1: [
        { activity: 'Scholastic Art & Writing Awards National Gold Medal', scoreRange: [9, 10], context: 'Most prestigious HS writing recognition', selectivityRatio: '~2,500 national medals from 340,000+ submissions', subcategory: 'fiction', fieldPrestige: 1, keyDifferentiator: 'National Gold Medal vs Silver vs regional award' },
        { activity: 'Published in nationally recognized outlet (NYT, Atlantic)', scoreRange: [9.5, 10], context: 'Professional-level publication while in high school', subcategory: 'journalism', fieldPrestige: 1, keyDifferentiator: 'National publication vs local/school' },
        { activity: 'Published novel/book (traditional publisher)', scoreRange: [9.5, 10], context: 'Traditional publication gatekeeping validates exceptional talent', subcategory: 'fiction', fieldPrestige: 1, keyDifferentiator: 'Traditional publisher vs self-published' },
      ],
      2: [
        { activity: 'Scholastic Regional Gold Key with publication', scoreRange: [7, 8.5], context: 'Top regional recognition; strong but below national', subcategory: 'fiction', fieldPrestige: 2, keyDifferentiator: 'Gold Key vs Silver Key vs Honorable Mention' },
        { activity: 'School newspaper Editor-in-Chief (award-winning paper)', scoreRange: [7, 8], context: 'Leading publication that wins NSPA/CSPA awards', subcategory: 'journalism', fieldPrestige: 2, keyDifferentiator: 'Award-winning paper vs typical school newspaper' },
        { activity: 'Published in literary journal/magazine', scoreRange: [7, 8], context: 'External publication beyond school', subcategory: 'fiction', fieldPrestige: 2, keyDifferentiator: 'External literary journal vs school literary magazine' },
        { activity: 'National journalism award (SPJ, CSPA Gold Crown, NSPA Pacemaker)', scoreRange: [7, 8.5], context: 'National recognition for journalistic excellence', subcategory: 'journalism', fieldPrestige: 1, keyDifferentiator: 'National award vs regional; individual vs publication' },
        { activity: 'Spoken word/poetry slam national competitor', scoreRange: [7, 8], context: 'National stage for oral literary performance', subcategory: 'poetry', fieldPrestige: 2, keyDifferentiator: 'National competitor vs local performer' },
        { activity: 'Self-published book with 500+ sales', scoreRange: [7, 8], context: 'Market validation through actual sales; requires marketing + craft', subcategory: 'fiction', fieldPrestige: 2, keyDifferentiator: '500+ sales validates quality; vs self-published with 0 sales' },
        { activity: 'Published in selective literary journal (Adroit, Polyphony Lit, Kenyon Review)', scoreRange: [7, 8.5], context: 'Selective literary journals with <5% acceptance rates; external validation of craft', subcategory: 'poetry', fieldPrestige: 1, keyDifferentiator: 'Selective journal (<5% acceptance) vs open submission journal vs school lit mag' },
      ],
      3: [
        { activity: 'School newspaper section editor', scoreRange: [5.5, 6.5], context: 'Editorial leadership without top position', subcategory: 'journalism', fieldPrestige: 3, keyDifferentiator: 'Section editor vs EIC vs staff writer' },
        { activity: 'Scholastic Honorable Mention / Silver Key', scoreRange: [5.5, 6.5], context: 'Recognition without top award', subcategory: 'fiction', fieldPrestige: 3, keyDifferentiator: 'Regional recognition vs no competition entry' },
        { activity: 'School literary magazine editor', scoreRange: [5.5, 6.5], context: 'Curating and managing creative publication', subcategory: 'fiction', fieldPrestige: 3, keyDifferentiator: 'Editor vs contributor' },
        { activity: 'Op-ed published in local/regional newspaper', scoreRange: [5.5, 6.5], context: 'Published opinion in community newspaper', subcategory: 'journalism', fieldPrestige: 3, keyDifferentiator: 'External local publication vs school newspaper' },
        { activity: 'Poetry/spoken word competition (regional/state)', scoreRange: [5.5, 6], context: 'Competitive performance of literary work', subcategory: 'poetry', fieldPrestige: 3, keyDifferentiator: 'Regional competition vs open mic' },
        { activity: 'Newsletter/Substack with 200+ subscribers', scoreRange: [5.5, 6.5], context: 'Building engaged readership for original writing', subcategory: 'academic_writing', fieldPrestige: 3, keyDifferentiator: '200+ subscribers vs 10; email subscribers are high-intent' },
        { activity: 'Academic paper presented at symposium/conference', scoreRange: [5.5, 6.5], context: 'Scholarly work presented in academic setting', subcategory: 'academic_writing', fieldPrestige: 3, keyDifferentiator: 'Presented vs submitted vs class assignment' },
      ],
      4: [
        { activity: 'School newspaper staff writer', scoreRange: [4, 5], context: 'Active contributor but limited leadership', subcategory: 'journalism', fieldPrestige: 4, keyDifferentiator: 'Regular contributor vs occasional writer' },
        { activity: 'Personal blog / creative writing hobby', scoreRange: [4, 4.5], context: 'Shows passion without external validation', subcategory: 'fiction', fieldPrestige: 4, keyDifferentiator: 'Regular posting vs dormant blog' },
        { activity: 'School literary magazine contributor', scoreRange: [4, 5], context: 'Published in school literary magazine', subcategory: 'fiction', fieldPrestige: 4, keyDifferentiator: 'Contributor vs editor; school magazine vs external' },
        { activity: 'Self-published on Amazon (minimal sales)', scoreRange: [4, 4.5], context: 'Published work but no market validation', subcategory: 'fiction', fieldPrestige: 4, keyDifferentiator: 'Self-published with minimal sales vs traditional publication' },
        { activity: 'Poetry club member / open mic performer', scoreRange: [4, 4.5], context: 'Participating in literary community', subcategory: 'poetry', fieldPrestige: 4, keyDifferentiator: 'Open mic vs competitive slam vs national stage' },
      ],
      5: [
        { activity: 'Personal journal/diary writing only', scoreRange: [2.5, 3.5], context: 'Private writing without sharing or external engagement', subcategory: 'fiction', fieldPrestige: 5, keyDifferentiator: 'Private writing vs published vs competitive' },
      ],
    },
  },

  // ========================================================================
  // 10. LEADERSHIP & GOVERNMENT
  // ========================================================================
  leadership_government: {
    label: 'Leadership & Student Government',
    keywords: ['student government', 'student council', 'president', 'vice president', 'class officer', 'club president', 'founded', 'honor society', 'nhs'],
    subcategories: [
      { key: 'student_government', name: 'Student Government', prestigeLevel: 2, prestigeContext: 'Elected positions show peer trust; impact matters more than title', typicalTier: 4, keywords: ['student government', 'student council', 'student body', 'elected'] },
      { key: 'club_leadership', name: 'Club Leadership', prestigeLevel: 3, prestigeContext: 'Impact and club significance differentiate', typicalTier: 4, keywords: ['club president', 'vice president', 'officer', 'secretary', 'treasurer'] },
      { key: 'organization_founding', name: 'Organization Founding', prestigeLevel: 1, prestigeContext: 'Creating something from nothing is most impressive', typicalTier: 3, keywords: ['founded', 'created', 'established', 'launched', 'started'] },
      { key: 'honor_societies', name: 'Honor Societies', prestigeLevel: 4, prestigeContext: 'Membership alone is low impact; leadership roles add value', typicalTier: 5, keywords: ['nhs', 'honor society', 'national honor society', 'mu alpha theta'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Honor society member, club attendee', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Club officer, homeroom representative', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Student body president, founded impactful club, multi-club leader', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Founded organization with 100+ members, elected to state/national youth office', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Founder', scoreModifier: 1.0, context: 'Created organization from scratch' },
      { role: 'Student Body President', scoreModifier: 0.7, context: 'Elected by entire student body' },
      { role: 'Club President', scoreModifier: 0.3, context: 'Led specific organization' },
      { role: 'Officer (VP/Secretary/Treasurer)', scoreModifier: 0.0, context: 'Supporting leadership role' },
      { role: 'Member', scoreModifier: -0.7, context: 'Attendance without leadership' },
    ],
    tiers: {
      1: [
        { activity: 'Girls State / Boys State delegate selected for Girls/Boys Nation', scoreRange: [9.5, 10], context: 'Top 2 delegates from state program advance to national program', selectivityRatio: '2 per state from ~300+ delegates', subcategory: 'student_government', fieldPrestige: 1, keyDifferentiator: 'National program (100 total) vs state program (300+)' },
        { activity: 'National youth leadership organization officer (NCSY, Key Club International, etc.)', scoreRange: [9, 10], context: 'National leadership role in major youth organization', subcategory: 'organization_founding', fieldPrestige: 1, keyDifferentiator: 'National officer vs local chapter leader' },
      ],
      2: [
        { activity: 'Founded school organization that grew to 50+ members', scoreRange: [7, 8.5], context: 'Creating something lasting that others join', subcategory: 'organization_founding', fieldPrestige: 1, keyDifferentiator: '50+ members vs 10 members vs never launched' },
        { activity: 'Student body president with measurable initiatives', scoreRange: [7, 8], context: 'Elected + implemented real policy changes', subcategory: 'student_government', fieldPrestige: 2, keyDifferentiator: 'Implemented initiatives vs held title only' },
        { activity: 'State-level youth government delegate', scoreRange: [7, 8], context: 'Selected to represent school/district at state level', subcategory: 'student_government', fieldPrestige: 2, keyDifferentiator: 'State delegation vs school-only' },
        { activity: 'HOBY / RYLA alumnus with follow-up leadership project', scoreRange: [7, 8], context: 'Selective leadership seminar (Hugh O\'Brien / Rotary) with post-program initiative', subcategory: 'organization_founding', fieldPrestige: 2, keyDifferentiator: 'Selective program + follow-up project vs attendance only; HOBY selects 1-2 per school' },
        { activity: 'Girls State / Boys State delegate', scoreRange: [7, 8], context: 'Selective civic leadership program at state level', selectivityRatio: '~300 per state from school nominations', subcategory: 'student_government', fieldPrestige: 2, keyDifferentiator: 'Selective state program vs school student government' },
        { activity: 'Student body president who passed school board-approved policy', scoreRange: [7, 8.5], context: 'Policy impact validated by school administration', subcategory: 'student_government', fieldPrestige: 2, keyDifferentiator: 'Board-approved policy vs student council resolution' },
        { activity: 'Eagle Scout / Girl Scout Gold Award (with significant service project)', scoreRange: [7, 8.5], context: 'Demonstrates sustained leadership, planning, and community service; ~6% earn Eagle', subcategory: 'organization_founding', fieldPrestige: 2, keyDifferentiator: 'Eagle/Gold with impactful project vs rank only; project scope matters' },
      ],
      3: [
        { activity: 'Student body president (standard impact)', scoreRange: [5.5, 6.5], context: 'Elected but without measurable policy impact', subcategory: 'student_government', fieldPrestige: 3, keyDifferentiator: 'Title holder vs change maker' },
        { activity: 'Club president with event organization', scoreRange: [5.5, 6.5], context: 'Managed club activities and events', subcategory: 'club_leadership', fieldPrestige: 3, keyDifferentiator: 'Active programming vs meeting-only club' },
        { activity: 'Club president (50+ member club with active programming)', scoreRange: [5.5, 6.5], context: 'Leading large club with regular events and community', subcategory: 'club_leadership', fieldPrestige: 3, keyDifferentiator: '50+ member active club vs 10-person meeting club' },
        { activity: 'Class president with event organization', scoreRange: [5.5, 6], context: 'Class-level leadership with event planning', subcategory: 'student_government', fieldPrestige: 3, keyDifferentiator: 'Class president vs class rep; events organized' },
        { activity: 'Multi-club officer (3+ clubs, coordinated schedule)', scoreRange: [5.5, 6], context: 'Leadership across multiple organizations; AOs may view skeptically as breadth over depth', subcategory: 'club_leadership', fieldPrestige: 3, keyDifferentiator: 'Breadth of leadership vs depth in one org' },
        { activity: 'JROTC battalion/company commander or equivalent senior rank', scoreRange: [5.5, 6.5], context: 'Senior JROTC leadership position; 490,000+ students in JROTC nationally', subcategory: 'club_leadership', fieldPrestige: 3, keyDifferentiator: 'Battalion commander vs squad leader vs member; demonstrates discipline and chain-of-command leadership' },
      ],
      4: [
        { activity: 'Club officer (VP/Secretary)', scoreRange: [4, 5], context: 'Supporting leadership without primary responsibility', subcategory: 'club_leadership', fieldPrestige: 4, keyDifferentiator: 'VP vs Secretary vs Treasurer roles' },
        { activity: 'Class representative', scoreRange: [4, 5], context: 'Elected but limited scope', subcategory: 'student_government', fieldPrestige: 4, keyDifferentiator: 'Class rep vs student body officer' },
        { activity: 'Club member (active participation, no officer role)', scoreRange: [4, 5], context: 'Regular attendance and contributions without title', subcategory: 'club_leadership', fieldPrestige: 4, keyDifferentiator: 'Active contributor vs passive member' },
        { activity: 'Homeroom/advisory representative', scoreRange: [4, 4.5], context: 'Low-stakes elected role with minimal responsibility', subcategory: 'student_government', fieldPrestige: 4, keyDifferentiator: 'Homeroom rep vs class officer' },
        { activity: 'Honor society officer (NHS VP/Secretary/Treasurer)', scoreRange: [4, 5], context: 'Leadership within honor society adds value to membership', subcategory: 'honor_societies', fieldPrestige: 4, keyDifferentiator: 'NHS officer vs NHS member' },
        { activity: 'JROTC member / junior rank (active participation)', scoreRange: [4, 5], context: 'JROTC participation shows discipline; 490,000+ students nationally', subcategory: 'club_leadership', fieldPrestige: 4, keyDifferentiator: 'Active JROTC member vs senior leadership rank' },
      ],
      5: [
        { activity: 'NHS member (no officer role)', scoreRange: [2.5, 3.5], context: 'GPA-based membership alone is not distinguishing', subcategory: 'honor_societies', fieldPrestige: 5, keyDifferentiator: 'NHS membership vs NHS officer vs NHS founder of initiative' },
        { activity: 'Multiple honor society memberships without leadership', scoreRange: [2.5, 3.5], context: 'Collecting memberships without active engagement', subcategory: 'honor_societies', fieldPrestige: 5, keyDifferentiator: 'Multiple passive memberships vs single active leadership' },
      ],
    },
  },

  // ========================================================================
  // 11. MEDICAL & HEALTH
  // ========================================================================
  medical_health: {
    label: 'Medical & Health',
    keywords: ['medical', 'health', 'hospital', 'clinical', 'patient', 'nursing', 'emt', 'ems', 'public health', 'mental health', 'cpr', 'first aid', 'pre-med', 'healthcare', 'hospital volunteer', 'hospital volunteering'],
    subcategories: [
      { key: 'clinical_volunteering', name: 'Clinical Volunteering', prestigeLevel: 3, prestigeContext: 'Common among pre-med applicants; impact differentiates', typicalTier: 4, keywords: ['hospital', 'clinic', 'patient', 'volunteer', 'candy striper'] },
      { key: 'research', name: 'Medical/Health Research', prestigeLevel: 1, prestigeContext: 'Research with clinical relevance most valued', typicalTier: 3, keywords: ['research', 'clinical trial', 'study', 'data', 'irb'] },
      { key: 'public_health', name: 'Public Health Initiatives', prestigeLevel: 2, prestigeContext: 'Community health impact with measurable outcomes', typicalTier: 4, keywords: ['public health', 'health fair', 'screening', 'vaccination', 'outreach'] },
      { key: 'emt_ems', name: 'EMT/EMS', prestigeLevel: 2, prestigeContext: 'Certification shows commitment; active duty is strong', typicalTier: 3, keywords: ['emt', 'ems', 'emergency', 'ambulance', 'first responder'] },
      { key: 'mental_health', name: 'Mental Health Advocacy', prestigeLevel: 2, prestigeContext: 'Growing area; personal story + organized impact valued', typicalTier: 4, keywords: ['mental health', 'crisis', 'counseling', 'awareness', 'suicide prevention'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Hospital volunteer doing basic tasks (gift shop, wayfinding)', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Regular clinical volunteer with patient interaction, CPR certified', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'EMT certified, health research assistant, founded health initiative', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Published health research, active EMT with 100+ calls, created org serving 500+', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Active EMT / First Responder', scoreModifier: 0.7, context: 'Licensed professional-level medical role' },
      { role: 'Research Lead / Program Creator', scoreModifier: 0.5, context: 'Led research or created health program' },
      { role: 'Regular Clinical Volunteer', scoreModifier: 0.0, context: 'Consistent presence with patient interaction' },
      { role: 'Shadowing / Observation Only', scoreModifier: -0.5, context: 'Watching without contributing' },
    ],
    tiers: {
      1: [
        { activity: 'Published medical/health research in peer-reviewed journal', scoreRange: [9, 10], context: 'Original health research meeting publication standards', subcategory: 'research', fieldPrestige: 1, keyDifferentiator: 'Peer-reviewed publication vs conference poster vs completed project' },
        { activity: 'Founded health organization serving 1000+ (sustained 2+ years)', scoreRange: [9, 10], context: 'Scaled health initiative with sustained community impact', subcategory: 'public_health', fieldPrestige: 1, keyDifferentiator: '1000+ served sustainably vs one-time health fair' },
      ],
      2: [
        { activity: 'Published health research with clinical relevance', scoreRange: [7.5, 8.5], context: 'Research directly applicable to patient care', subcategory: 'research', fieldPrestige: 1, keyDifferentiator: 'Published vs presented vs completed' },
        { activity: 'Active EMT with 100+ emergency calls', scoreRange: [7, 8.5], context: 'Real emergency medical experience as a teenager', subcategory: 'emt_ems', fieldPrestige: 1, keyDifferentiator: 'Active duty with calls vs certification only' },
        { activity: 'Founded health screening program (500+ screened)', scoreRange: [7, 8], context: 'Created lasting public health infrastructure', subcategory: 'public_health', fieldPrestige: 1, keyDifferentiator: 'Program creation vs volunteer at existing program' },
        { activity: 'CNA certification with 500+ patient care hours', scoreRange: [7, 8.5], context: 'Professional nursing assistant credential with extensive patient contact', subcategory: 'clinical_volunteering', fieldPrestige: 1, keyDifferentiator: 'CNA certification vs volunteer; 500+ hours vs minimal' },
        { activity: 'Peer crisis counselor (certified, 100+ hours)', scoreRange: [7, 8], context: 'Trained and certified in crisis intervention; real mental health work', subcategory: 'mental_health', fieldPrestige: 1, keyDifferentiator: 'Certified counselor with hours vs awareness campaign' },
      ],
      3: [
        { activity: 'EMT certified with some volunteer shifts', scoreRange: [5.5, 6.5], context: 'Certification is impressive; limited field experience', subcategory: 'emt_ems', fieldPrestige: 3, keyDifferentiator: 'Certified + some shifts vs certification alone' },
        { activity: 'Hospital volunteer with 200+ hours, patient interaction', scoreRange: [5.5, 6.5], context: 'Sustained clinical volunteering beyond the minimum', subcategory: 'clinical_volunteering', fieldPrestige: 3, keyDifferentiator: '200+ hours with patient interaction vs gift shop' },
        { activity: 'Mental health awareness campaign (school-wide)', scoreRange: [5.5, 6.5], context: 'Organized awareness program with measurable reach', subcategory: 'mental_health', fieldPrestige: 3, keyDifferentiator: 'School-wide campaign vs personal blog' },
        { activity: 'Hospital volunteer in specialized unit (ER, pediatrics, oncology)', scoreRange: [5.5, 6.5], context: 'Specialized unit placement shows depth of clinical exposure', subcategory: 'clinical_volunteering', fieldPrestige: 3, keyDifferentiator: 'Specialized unit vs general volunteer pool' },
        { activity: 'Health research data analyst/assistant role', scoreRange: [5.5, 6.5], context: 'Contributing to health research through data analysis', subcategory: 'research', fieldPrestige: 3, keyDifferentiator: 'Data analysis role vs data entry vs observation' },
        { activity: 'Mental health peer support group founder (school-level)', scoreRange: [5.5, 6.5], context: 'Created peer support infrastructure at school', subcategory: 'mental_health', fieldPrestige: 3, keyDifferentiator: 'Founded group vs attended sessions' },
        { activity: 'HOSA state/national competitor (Future Health Professionals)', scoreRange: [5.5, 6.5], context: 'Health career competition with state/national advancement', selectivityRatio: 'HOSA: ~250,000 members; ~5,000 at nationals', subcategory: 'public_health', fieldPrestige: 3, keyDifferentiator: 'State/national competitor vs chapter member; health career-specific competition' },
        { activity: 'Dental/optometry volunteer with patient interaction', scoreRange: [5.5, 6], context: 'Clinical experience in specialty care setting', subcategory: 'clinical_volunteering', fieldPrestige: 3, keyDifferentiator: 'Patient-facing dental/eye care vs observation' },
        { activity: 'Public health outreach with measurable community reach (200+)', scoreRange: [5.5, 6.5], context: 'Health education or screening reaching significant population', subcategory: 'public_health', fieldPrestige: 3, keyDifferentiator: '200+ reached vs small awareness event' },
      ],
      4: [
        { activity: 'Hospital volunteer (standard, 50-100 hours)', scoreRange: [4, 5], context: 'Very common pre-med activity; hours matter', subcategory: 'clinical_volunteering', fieldPrestige: 4, keyDifferentiator: 'Standard volunteer vs specialized role' },
        { activity: 'CPR/First Aid certified', scoreRange: [4, 4.5], context: 'Useful skill but not distinguishing', subcategory: 'emt_ems', fieldPrestige: 5, keyDifferentiator: 'CPR cert vs EMT cert vs active EMT' },
        { activity: 'Hospital gift shop/clerical volunteer', scoreRange: [4, 4.5], context: 'Hospital volunteer in non-clinical role', subcategory: 'clinical_volunteering', fieldPrestige: 4, keyDifferentiator: 'Gift shop/clerical vs patient-facing; location vs function' },
        { activity: 'Health career exploration program participant', scoreRange: [4, 4.5], context: 'Summer health career program or pipeline program', subcategory: 'public_health', fieldPrestige: 4, keyDifferentiator: 'Structured program vs self-directed exploration' },
        { activity: 'First Aid/AED certified only', scoreRange: [4, 4.5], context: 'Basic safety certification without clinical application', subcategory: 'emt_ems', fieldPrestige: 5, keyDifferentiator: 'First Aid only vs EMT vs active first responder' },
      ],
      5: [
        { activity: 'Medical shadowing (observation only)', scoreRange: [2.5, 3.5], context: 'Watching without contributing; extremely common', subcategory: 'clinical_volunteering', fieldPrestige: 5, keyDifferentiator: 'Shadowing vs volunteering vs research' },
        { activity: 'Attended health career fair/seminar only', scoreRange: [2.5, 3], context: 'Passive exposure to medical careers', subcategory: 'public_health', fieldPrestige: 5, keyDifferentiator: 'Attended seminar vs active clinical involvement' },
      ],
    },
  },

  // ========================================================================
  // 12. VISUAL ARTS
  // ========================================================================
  visual_arts: {
    label: 'Visual Arts & Design',
    keywords: ['art', 'painting', 'drawing', 'sculpture', 'photography', 'design', 'graphic design', 'portfolio', 'gallery', 'exhibition', 'ceramics', 'illustration'],
    subcategories: [
      { key: 'fine_art', name: 'Fine Art (Painting/Drawing/Sculpture)', prestigeLevel: 2, prestigeContext: 'Scholastic Art Awards and gallery shows differentiate', typicalTier: 4, keywords: ['painting', 'drawing', 'sculpture', 'fine art', 'canvas', 'oil', 'watercolor'] },
      { key: 'photography', name: 'Photography', prestigeLevel: 3, prestigeContext: 'Published/exhibited work distinguishes from hobby', typicalTier: 4, keywords: ['photography', 'photo', 'camera', 'darkroom', 'digital photography'] },
      { key: 'design', name: 'Graphic/Digital Design', prestigeLevel: 3, prestigeContext: 'Professional clients or published work elevates', typicalTier: 4, keywords: ['design', 'graphic', 'ui', 'ux', 'logo', 'branding', 'adobe'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Art class participation, personal portfolio', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'School exhibitions, local competition entries', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Scholastic regional awards, gallery exhibitions, commissioned work', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Scholastic National Gold, YoungArts, professional gallery representation', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Featured/Exhibited Artist', scoreModifier: 0.5, context: 'Selected for exhibition or publication' },
      { role: 'Commissioned/Professional', scoreModifier: 0.7, context: 'Paid for artistic work' },
      { role: 'Active Creator', scoreModifier: 0.0, context: 'Regularly producing work' },
      { role: 'Student / Hobbyist', scoreModifier: -0.3, context: 'Exploring art without external validation' },
    ],
    tiers: {
      1: [
        { activity: 'Scholastic Art Awards National Gold Medal', scoreRange: [9, 10], context: 'Most prestigious HS art recognition', selectivityRatio: '~2,500 national medals from 340,000+ entries', subcategory: 'fine_art', fieldPrestige: 1, keyDifferentiator: 'National Gold vs Silver vs regional' },
        { activity: 'YoungArts Winner/Finalist (Visual Arts, With Distinction)', scoreRange: [9, 10], context: 'Elite national recognition for emerging visual artists', selectivityRatio: '~150-170 With Distinction from 9,000-11,000 (~1.5-1.9%)', subcategory: 'fine_art', fieldPrestige: 1, keyDifferentiator: 'With Distinction vs Honorable Mention vs Merit; terminology updated 2024' },
      ],
      2: [
        { activity: 'Scholastic Regional Gold Key with exhibition', scoreRange: [7, 8.5], context: 'Top regional recognition; strong portfolio piece', subcategory: 'fine_art', fieldPrestige: 2, keyDifferentiator: 'Gold Key vs Silver Key vs Honorable Mention' },
        { activity: 'Gallery exhibition (juried, non-school)', scoreRange: [7, 8], context: 'Selected by professional curator for external gallery', subcategory: 'fine_art', fieldPrestige: 2, keyDifferentiator: 'Juried gallery vs open show vs school gallery' },
        { activity: 'Professional freelance design portfolio (5+ paying clients)', scoreRange: [7, 8.5], context: 'Professional design work with repeat paying clients', subcategory: 'design', fieldPrestige: 2, keyDifferentiator: '5+ paying clients vs personal projects' },
        { activity: 'Architecture/design competition winner (regional+)', scoreRange: [7, 8], context: 'Competitive recognition in design field', subcategory: 'design', fieldPrestige: 2, keyDifferentiator: 'Competition win vs submission; regional+ vs local' },
        { activity: 'Congressional Art Competition winner', scoreRange: [7, 8], context: 'Won congressional district art competition; displayed in U.S. Capitol for one year', subcategory: 'fine_art', fieldPrestige: 2, keyDifferentiator: 'District winner (1 per district) displayed in Capitol vs participant' },
        { activity: 'Published illustration in print/digital media', scoreRange: [7, 8], context: 'Illustration published in book, magazine, or major website', subcategory: 'fine_art', fieldPrestige: 2, keyDifferentiator: 'Published illustration vs personal portfolio' },
      ],
      3: [
        { activity: 'Scholastic Silver Key / Honorable Mention', scoreRange: [5.5, 6.5], context: 'Recognition without top award', subcategory: 'fine_art', fieldPrestige: 3, keyDifferentiator: 'Regional recognition tier' },
        { activity: 'Published photography or paid design work', scoreRange: [5.5, 6.5], context: 'External validation through publication or clients', subcategory: 'photography', fieldPrestige: 3, keyDifferentiator: 'Paid work vs personal projects' },
        { activity: 'Digital illustration with online following (500+ followers)', scoreRange: [5.5, 6.5], context: 'Building audience for original digital art', subcategory: 'fine_art', fieldPrestige: 3, keyDifferentiator: '500+ engaged followers vs empty portfolio' },
        { activity: 'Animation/motion graphics completed project', scoreRange: [5.5, 6.5], context: 'Finished animation screened or published online', subcategory: 'design', fieldPrestige: 3, keyDifferentiator: 'Completed project vs work-in-progress' },
        { activity: 'Photography competition award (local/regional)', scoreRange: [5.5, 6], context: 'Competitive recognition in photography', subcategory: 'photography', fieldPrestige: 3, keyDifferentiator: 'Competition award vs personal portfolio' },
        { activity: 'UI/UX design for live product/app', scoreRange: [5.5, 6.5], context: 'Design work deployed in real application', subcategory: 'design', fieldPrestige: 3, keyDifferentiator: 'Live product vs mockup/concept' },
        { activity: 'AP Art portfolio (score 4-5)', scoreRange: [5.5, 6.5], context: 'Strong AP portfolio demonstrates sustained body of work', subcategory: 'fine_art', fieldPrestige: 3, keyDifferentiator: 'AP 4-5 score vs lower; breadth of portfolio' },
      ],
      4: [
        { activity: 'School art show participant', scoreRange: [4, 5], context: 'Showing work at school-level exhibition', subcategory: 'fine_art', fieldPrestige: 4, keyDifferentiator: 'School show vs external exhibition' },
        { activity: 'Art class with strong portfolio', scoreRange: [4, 4.5], context: 'Active art student without competition/exhibition', subcategory: 'fine_art', fieldPrestige: 5, keyDifferentiator: 'Dedicated practice vs class requirement' },
        { activity: 'Personal design portfolio (Behance/Dribbble)', scoreRange: [4, 5], context: 'Online presence for design work without paid clients', subcategory: 'design', fieldPrestige: 4, keyDifferentiator: 'Curated portfolio vs class assignments' },
        { activity: 'Etsy/Redbubble creative marketplace shop', scoreRange: [4, 5], context: 'Selling creative products online; initiative shown', subcategory: 'fine_art', fieldPrestige: 4, keyDifferentiator: 'Active shop with sales vs listed without buyers' },
        { activity: 'School yearbook/poster design', scoreRange: [4, 4.5], context: 'Applied design for school publications', subcategory: 'design', fieldPrestige: 4, keyDifferentiator: 'Design lead vs contributor' },
      ],
      5: [
        { activity: 'Art class participation (class requirement only)', scoreRange: [2.5, 3.5], context: 'Taking art as part of curriculum without extra investment', subcategory: 'fine_art', fieldPrestige: 5, keyDifferentiator: 'Required class vs elective vs dedicated practice' },
      ],
    },
  },

  // ========================================================================
  // 13. SOCIAL ACTIVISM
  // ========================================================================
  social_activism: {
    label: 'Social Activism & Advocacy',
    keywords: ['activism', 'advocacy', 'social justice', 'environment', 'climate', 'political', 'voter', 'campaign', 'protest', 'organizing', 'equity', 'diversity', 'inclusion'],
    subcategories: [
      { key: 'policy_advocacy', name: 'Policy Advocacy', prestigeLevel: 1, prestigeContext: 'Achieved policy changes are most impressive', typicalTier: 3, keywords: ['policy', 'legislation', 'testimony', 'lobbying', 'government'] },
      { key: 'environmental', name: 'Environmental Activism', prestigeLevel: 2, prestigeContext: 'Measurable environmental impact differentiates', typicalTier: 4, keywords: ['environment', 'climate', 'sustainability', 'conservation', 'recycling', 'cleanup'] },
      { key: 'social_justice', name: 'Social Justice', prestigeLevel: 2, prestigeContext: 'Organized action with community impact valued', typicalTier: 4, keywords: ['social justice', 'equity', 'racial justice', 'gender equality', 'discrimination'] },
      { key: 'community_organizing', name: 'Community Organizing', prestigeLevel: 2, prestigeContext: 'Mobilizing others for collective action', typicalTier: 4, keywords: ['organizing', 'campaign', 'mobilize', 'rally', 'voter registration'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Attended rallies/events, signed petitions', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Organized school-level campaigns, started awareness club', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Community-wide campaign, media coverage, organized events for 200+', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Policy change achieved, national media, testified before legislature', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Campaign Organizer / Founder', scoreModifier: 1.0, context: 'Created and led advocacy campaign' },
      { role: 'Lead Volunteer / Chapter Head', scoreModifier: 0.3, context: 'Led local implementation' },
      { role: 'Active Participant', scoreModifier: 0.0, context: 'Regular involvement in actions' },
      { role: 'Attendee / Supporter', scoreModifier: -0.5, context: 'Showed up without organizing role' },
    ],
    tiers: {
      1: [
        { activity: 'Testified before legislature and influenced specific policy change', scoreRange: [9, 10], context: 'Youth advocacy that resulted in documented legislative action', subcategory: 'policy_advocacy', fieldPrestige: 1, keyDifferentiator: 'Policy change achieved vs testimony without outcome' },
        { activity: 'Led statewide/national youth advocacy movement with media coverage', scoreRange: [9, 10], context: 'Youth-led movement covered by major media outlets', subcategory: 'community_organizing', fieldPrestige: 1, keyDifferentiator: 'National media coverage + scale vs local awareness' },
      ],
      2: [
        { activity: 'Organized community campaign reaching 500+ people', scoreRange: [7, 8.5], context: 'Significant community mobilization', subcategory: 'community_organizing', fieldPrestige: 2, keyDifferentiator: '500+ reached vs school-only' },
        { activity: 'Voter registration drive (100+ voters registered)', scoreRange: [7, 8], context: 'Quantifiable civic engagement impact', subcategory: 'policy_advocacy', fieldPrestige: 2, keyDifferentiator: '100+ registered vs awareness only' },
        { activity: 'Environmental initiative with measurable impact', scoreRange: [7, 8], context: 'Quantified environmental outcomes (tons recycled, trees planted)', subcategory: 'environmental', fieldPrestige: 2, keyDifferentiator: 'Measurable impact vs awareness campaign' },
        { activity: 'Organized divestment campaign resulting in institutional action', scoreRange: [7, 8.5], context: 'Advocacy that achieved concrete institutional change', subcategory: 'policy_advocacy', fieldPrestige: 1, keyDifferentiator: 'Institutional action achieved vs petition submitted' },
        { activity: 'Led climate strike/walkout at scale (500+ participants)', scoreRange: [7, 8], context: 'Large-scale organized action demonstrating mobilization ability', subcategory: 'environmental', fieldPrestige: 2, keyDifferentiator: '500+ participants at organized event vs attending march' },
      ],
      3: [
        { activity: 'School environmental club leader with initiatives', scoreRange: [5.5, 6.5], context: 'School-level environmental action', subcategory: 'environmental', fieldPrestige: 3, keyDifferentiator: 'Active initiatives vs meeting-only club' },
        { activity: 'Social justice awareness campaign (school-wide)', scoreRange: [5.5, 6.5], context: 'Organized school-wide education/awareness', subcategory: 'social_justice', fieldPrestige: 3, keyDifferentiator: 'Organized campaign vs personal posts' },
        { activity: 'School sustainability committee with policy implementation', scoreRange: [5.5, 6.5], context: 'Led school-level sustainability changes (recycling, composting)', subcategory: 'environmental', fieldPrestige: 3, keyDifferentiator: 'Implemented changes vs proposed changes' },
        { activity: 'Peer education program on social issues (trained 20+ peers)', scoreRange: [5.5, 6], context: 'Trained fellow students to be advocates/educators', subcategory: 'social_justice', fieldPrestige: 3, keyDifferentiator: 'Trained others vs raised personal awareness' },
        { activity: 'Community garden/environmental restoration project', scoreRange: [5.5, 6.5], context: 'Hands-on environmental improvement with lasting impact', subcategory: 'environmental', fieldPrestige: 3, keyDifferentiator: 'Created lasting physical improvement vs one-time cleanup' },
      ],
      4: [
        { activity: 'Environmental club member', scoreRange: [4, 5], context: 'Participation without leadership or measurable impact', subcategory: 'environmental', fieldPrestige: 4, keyDifferentiator: 'Club member vs club leader vs campaign organizer' },
        { activity: 'Diversity/equity club member without initiatives', scoreRange: [4, 5], context: 'Attendance at meetings without organizing actions', subcategory: 'social_justice', fieldPrestige: 4, keyDifferentiator: 'Member vs organizer' },
        { activity: 'Social media advocacy page (personal)', scoreRange: [4, 4.5], context: 'Online advocacy without organized community action', subcategory: 'social_justice', fieldPrestige: 4, keyDifferentiator: 'Social media posts vs real-world action' },
        { activity: 'Wrote letters to elected representatives', scoreRange: [4, 4.5], context: 'Individual civic engagement showing awareness', subcategory: 'policy_advocacy', fieldPrestige: 4, keyDifferentiator: 'Letters written vs petition signed' },
      ],
      5: [
        { activity: 'Attended rallies or signed petitions', scoreRange: [2.5, 3.5], context: 'Passive participation in others\' campaigns', subcategory: 'community_organizing', fieldPrestige: 5, keyDifferentiator: 'Attending vs organizing' },
        { activity: 'Shared social justice content on personal social media', scoreRange: [2.5, 3], context: 'Reposting without original action or organization', subcategory: 'social_justice', fieldPrestige: 5, keyDifferentiator: 'Resharing vs creating vs organizing' },
      ],
    },
  },

  // ========================================================================
  // 14. WORK & FAMILY
  // ========================================================================
  work_family: {
    label: 'Work Experience & Family Responsibilities',
    keywords: ['work', 'job', 'employment', 'internship', 'family', 'caregiver', 'sibling', 'parent', 'household', 'business', 'part-time', 'full-time'],
    subcategories: [
      { key: 'employment', name: 'Employment', prestigeLevel: 3, prestigeContext: 'Sustained work shows responsibility; progression matters', typicalTier: 4, keywords: ['work', 'job', 'employee', 'part-time', 'retail', 'restaurant', 'wages'] },
      { key: 'caregiving', name: 'Family Caregiving', prestigeLevel: 2, prestigeContext: 'Significant caregiving is deeply valued for context', typicalTier: 4, keywords: ['caregiver', 'sibling', 'parent', 'family', 'household', 'cook', 'childcare'] },
      { key: 'family_business', name: 'Family Business', prestigeLevel: 3, prestigeContext: 'Responsibility level within business matters', typicalTier: 4, keywords: ['family business', 'family store', 'family restaurant'] },
      { key: 'internship', name: 'Professional Internship', prestigeLevel: 2, prestigeContext: 'Selective internships valued; casual ones less so', typicalTier: 3, keywords: ['intern', 'internship', 'professional', 'office', 'corporate'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Occasional babysitting, minimal work hours', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Part-time job, regular family responsibilities', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Promoted at work, significant caregiving, competitive internship', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Supporting family financially, managing business operations, prestigious internship', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Manager / Supervisor', scoreModifier: 0.5, context: 'Promoted to management role' },
      { role: 'Primary Caregiver', scoreModifier: 0.5, context: 'Family depends on this student\'s care' },
      { role: 'Regular Employee', scoreModifier: 0.0, context: 'Consistent work attendance and performance' },
      { role: 'Occasional / Seasonal', scoreModifier: -0.3, context: 'Limited time commitment' },
    ],
    tiers: {
      1: [
        { activity: 'Primary family income earner while maintaining strong academics', scoreRange: [9, 10], context: 'Working 20+ hrs/week as primary financial support; extraordinary sacrifice', subcategory: 'employment', fieldPrestige: 1, keyDifferentiator: 'Primary income earner vs supplemental income vs pocket money' },
      ],
      2: [
        { activity: 'Primary family caregiver (20+ hrs/week) while maintaining grades', scoreRange: [7, 8.5], context: 'Extraordinary maturity and sacrifice', subcategory: 'caregiving', fieldPrestige: 1, keyDifferentiator: '20+ hrs/week vs occasional help' },
        { activity: 'Promoted to management at part-time job', scoreRange: [7, 8], context: 'Demonstrated leadership in professional setting', subcategory: 'employment', fieldPrestige: 2, keyDifferentiator: 'Promoted to manager vs regular employee' },
        { activity: 'Selective professional internship (competitive application)', scoreRange: [7, 8.5], context: 'Selected through competitive process', subcategory: 'internship', fieldPrestige: 1, keyDifferentiator: 'Competitive application vs family connection' },
        { activity: 'Tech/finance internship at competitive firm', scoreRange: [7.5, 8.5], context: 'Internship at known firm (tech startup, bank, consulting) through merit', selectivityRatio: 'Varies; top firms accept <5% of HS applicants', subcategory: 'internship', fieldPrestige: 1, keyDifferentiator: 'Competitive firm vs local business; merit-selected vs connection' },
        { activity: 'Skilled trade apprenticeship with certification', scoreRange: [7, 8], context: 'Formal apprenticeship leading to industry certification', subcategory: 'employment', fieldPrestige: 2, keyDifferentiator: 'Certification earned vs job training; skilled trade vs retail' },
        { activity: 'Farm work / agricultural labor (15+ hrs/week, sustained)', scoreRange: [7, 8], context: 'Sustained agricultural work supporting family or community; often invisible in applications', subcategory: 'employment', fieldPrestige: 2, keyDifferentiator: 'Sustained agricultural labor vs summer job; family necessity context adds depth' },
      ],
      3: [
        { activity: 'Part-time job (15+ hrs/week, 2+ years)', scoreRange: [5.5, 6.5], context: 'Sustained employment shows responsibility', subcategory: 'employment', fieldPrestige: 3, keyDifferentiator: '15+ hrs/week for 2+ years vs seasonal' },
        { activity: 'Regular family caregiving (10-20 hrs/week)', scoreRange: [5.5, 6.5], context: 'Significant family responsibility', subcategory: 'caregiving', fieldPrestige: 3, keyDifferentiator: 'Regular schedule vs occasional help' },
        { activity: 'Family business significant responsibility', scoreRange: [5.5, 6.5], context: 'Managing operations, not just helping', subcategory: 'family_business', fieldPrestige: 3, keyDifferentiator: 'Operational responsibility vs helping out' },
        { activity: 'Summer internship at local company with defined project', scoreRange: [5.5, 6.5], context: 'Structured internship with deliverables', subcategory: 'internship', fieldPrestige: 3, keyDifferentiator: 'Defined project deliverable vs shadowing/coffee runs' },
        { activity: 'Family business management with revenue responsibility', scoreRange: [5.5, 6.5], context: 'Managing P&L, inventory, or operations of family business', subcategory: 'family_business', fieldPrestige: 3, keyDifferentiator: 'Revenue/operational responsibility vs helping at counter' },
        { activity: 'Work-study program (financial aid context)', scoreRange: [5.5, 6], context: 'Employment as part of financial aid demonstrates need and responsibility', subcategory: 'employment', fieldPrestige: 3, keyDifferentiator: 'Financial need context adds dimension' },
      ],
      4: [
        { activity: 'Part-time job (seasonal or <10 hrs/week)', scoreRange: [4, 5], context: 'Employment experience without significant hours', subcategory: 'employment', fieldPrestige: 4, keyDifferentiator: 'Seasonal vs year-round work' },
        { activity: 'Helping with family chores/errands', scoreRange: [4, 4.5], context: 'Expected household participation', subcategory: 'caregiving', fieldPrestige: 5, keyDifferentiator: 'Regular chores vs caregiving responsibility' },
        { activity: 'Babysitting/tutoring side work (regular clients)', scoreRange: [4, 5], context: 'Informal but sustained side work showing reliability', subcategory: 'employment', fieldPrestige: 4, keyDifferentiator: 'Regular clients vs occasional; self-found vs assigned' },
        { activity: 'Unpaid internship with limited responsibility', scoreRange: [4, 4.5], context: 'Shadowing/observation internship without real deliverables', subcategory: 'internship', fieldPrestige: 4, keyDifferentiator: 'Unpaid with no deliverables vs structured internship' },
      ],
      5: [
        { activity: 'Occasional odd jobs without sustained pattern', scoreRange: [2.5, 3.5], context: 'Sporadic work without commitment or growth', subcategory: 'employment', fieldPrestige: 5, keyDifferentiator: 'Occasional vs regular; no skill development' },
        { activity: 'Summer camp counselor (1 week)', scoreRange: [2.5, 3.5], context: 'Minimal duration and responsibility', subcategory: 'employment', fieldPrestige: 5, keyDifferentiator: '1-week camp vs sustained employment' },
      ],
    },
  },

  // ========================================================================
  // 15. RELIGIOUS & CULTURAL
  // ========================================================================
  religious_cultural: {
    label: 'Religious & Cultural Activities',
    keywords: ['church', 'temple', 'mosque', 'synagogue', 'religious', 'faith', 'cultural', 'heritage', 'language', 'community', 'sunday school', 'youth group', 'mission'],
    subcategories: [
      { key: 'faith_community', name: 'Faith Community Leadership', prestigeLevel: 2, prestigeContext: 'Leadership within religious community valued for character', typicalTier: 4, keywords: ['youth group', 'sunday school', 'teaching', 'leader', 'ministry'] },
      { key: 'cultural_preservation', name: 'Cultural Preservation', prestigeLevel: 2, prestigeContext: 'Heritage preservation shows identity strength', typicalTier: 4, keywords: ['cultural', 'heritage', 'language', 'tradition', 'preservation'] },
      { key: 'interfaith', name: 'Interfaith/Cross-Cultural', prestigeLevel: 2, prestigeContext: 'Bridge-building across communities valued', typicalTier: 4, keywords: ['interfaith', 'cross-cultural', 'dialogue', 'diversity'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Regular attendance at religious/cultural events', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Active participant, teaching role, youth group officer', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Youth leader, organized community events, mission/service trips', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'Founded interfaith initiative, organized large-scale service, cultural preservation project', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Youth Leader / Teacher', scoreModifier: 0.5, context: 'Leading younger members or teaching classes' },
      { role: 'Event Organizer', scoreModifier: 0.3, context: 'Organized community events or programs' },
      { role: 'Active Member', scoreModifier: 0.0, context: 'Regular participant contributing to community' },
      { role: 'Attendee', scoreModifier: -0.5, context: 'Attendance without active contribution' },
    ],
    tiers: {
      1: [
        { activity: 'Founded interfaith org operating across multiple cities/states', scoreRange: [9, 10], context: 'Scaled cross-cultural bridge-building beyond single community', subcategory: 'interfaith', fieldPrestige: 1, keyDifferentiator: 'Multi-city/state org vs single-community program' },
      ],
      2: [
        { activity: 'Founded interfaith dialogue program (multiple communities)', scoreRange: [7, 8.5], context: 'Bridge-building across religious/cultural divides', subcategory: 'interfaith', fieldPrestige: 1, keyDifferentiator: 'Multi-community program vs single-community event' },
        { activity: 'Led service mission with 50+ participants', scoreRange: [7, 8], context: 'Organized and led significant service initiative', subcategory: 'faith_community', fieldPrestige: 2, keyDifferentiator: 'Led 50+ participants vs attended mission' },
        { activity: 'Heritage language school teacher/curriculum developer', scoreRange: [7, 8.5], context: 'Teaching and preserving cultural language for younger generation', subcategory: 'cultural_preservation', fieldPrestige: 1, keyDifferentiator: 'Curriculum development vs student role' },
        { activity: 'Cultural dance/performance troupe leader with regional performances', scoreRange: [7, 8], context: 'Leading cultural performance group beyond school audience', subcategory: 'cultural_preservation', fieldPrestige: 2, keyDifferentiator: 'Regional performances vs school-only; leader vs member' },
        { activity: 'BBYO / NCSY / USY / JSA regional/national officer', scoreRange: [7, 8], context: 'Regional or national leadership in major Jewish or interfaith youth organization', subcategory: 'faith_community', fieldPrestige: 2, keyDifferentiator: 'Regional/national officer vs chapter-level; BBYO has 70,000+ members globally' },
        { activity: 'Eagle Scout / Gold Award with faith-based community project', scoreRange: [7, 8.5], context: 'Eagle/Gold project through religious community with lasting impact', subcategory: 'faith_community', fieldPrestige: 2, keyDifferentiator: 'Eagle/Gold project vs rank completion only' },
      ],
      3: [
        { activity: 'Youth group leader teaching 20+ students', scoreRange: [5.5, 6.5], context: 'Teaching/mentoring role within community', subcategory: 'faith_community', fieldPrestige: 3, keyDifferentiator: 'Teaching role vs participant' },
        { activity: 'Cultural heritage preservation project', scoreRange: [5.5, 6.5], context: 'Active preservation of cultural traditions', subcategory: 'cultural_preservation', fieldPrestige: 3, keyDifferentiator: 'Active project vs attendance at cultural events' },
        { activity: 'Heritage language proficiency maintained (fluent reader/writer)', scoreRange: [5.5, 6.5], context: 'Functional biliteracy in heritage language shows sustained effort', subcategory: 'cultural_preservation', fieldPrestige: 2, keyDifferentiator: 'Fluent reader/writer vs conversational vs passive' },
        { activity: 'Cultural festival organizer (100+ attendees)', scoreRange: [5.5, 6.5], context: 'Organized cultural celebration for broader community', subcategory: 'cultural_preservation', fieldPrestige: 3, keyDifferentiator: '100+ attendees vs family-only event' },
        { activity: 'Mission/service trip with sustained follow-up project', scoreRange: [5.5, 6.5], context: 'Trip with ongoing commitment beyond travel dates', subcategory: 'faith_community', fieldPrestige: 3, keyDifferentiator: 'Sustained follow-up vs one-time trip' },
        { activity: 'Religious text study group leader', scoreRange: [5.5, 6], context: 'Led peer learning around sacred texts or theology', subcategory: 'faith_community', fieldPrestige: 3, keyDifferentiator: 'Leader vs participant; peer study vs adult-led' },
        { activity: 'Interfaith community event coordinator (one-time)', scoreRange: [5.5, 6], context: 'Single cross-community event showing initiative', subcategory: 'interfaith', fieldPrestige: 3, keyDifferentiator: 'One-time event vs sustained program' },
      ],
      4: [
        { activity: 'Regular youth group member', scoreRange: [4, 5], context: 'Consistent participation without leadership', subcategory: 'faith_community', fieldPrestige: 4, keyDifferentiator: 'Regular attendance vs occasional' },
        { activity: 'Heritage language student (weekend/after-school program)', scoreRange: [4, 5], context: 'Enrolled in heritage language classes', subcategory: 'cultural_preservation', fieldPrestige: 4, keyDifferentiator: 'Enrolled student vs fluent speaker' },
        { activity: 'Church/temple/mosque youth group officer', scoreRange: [4, 5], context: 'Officer role in faith community youth group', subcategory: 'faith_community', fieldPrestige: 4, keyDifferentiator: 'Officer vs member vs leader' },
        { activity: 'Cultural dance/music class participant', scoreRange: [4, 5], context: 'Learning cultural performance arts', subcategory: 'cultural_preservation', fieldPrestige: 4, keyDifferentiator: 'Class participant vs performer vs troupe leader' },
        { activity: 'Confirmation/Bar Mitzvah/coming-of-age ceremony leadership', scoreRange: [4, 4.5], context: 'Religious rite of passage with leadership component', subcategory: 'faith_community', fieldPrestige: 4, keyDifferentiator: 'Leadership in ceremony vs participation only' },
      ],
      5: [
        { activity: 'Passive attendance at religious/cultural events', scoreRange: [2.5, 3.5], context: 'Attendance without active engagement', subcategory: 'faith_community', fieldPrestige: 5, keyDifferentiator: 'Attendance vs participation vs leadership' },
        { activity: 'Occasional cultural event attendee (no involvement)', scoreRange: [2.5, 3], context: 'Attending without contributing or organizing', subcategory: 'cultural_preservation', fieldPrestige: 5, keyDifferentiator: 'Attendee vs organizer vs performer' },
      ],
    },
  },

  // ========================================================================
  // 16. ACADEMIC ENRICHMENT
  // ========================================================================
  academic_enrichment: {
    label: 'Academic Enrichment',
    keywords: ['summer program', 'dual enrollment', 'college course', 'independent study', 'academic', 'seminar', 'enrichment', 'online course', 'mooc'],
    subcategories: [
      { key: 'summer_programs', name: 'Selective Summer Programs', prestigeLevel: 1, prestigeContext: 'Selectivity and rigor differentiate; pay-to-play programs less valued', typicalTier: 3, keywords: ['summer program', 'ssp', 'mathcamp', 'rsi', 'tasp', 'ross', 'promys', 'sua'] },
      { key: 'dual_enrollment', name: 'Dual Enrollment / College Courses', prestigeLevel: 3, prestigeContext: 'Performance in college courses matters more than enrollment', typicalTier: 4, keywords: ['dual enrollment', 'college course', 'community college', 'university course'] },
      { key: 'independent_study', name: 'Independent Study / Self-Directed', prestigeLevel: 2, prestigeContext: 'Self-directed learning with documented outcomes valued', typicalTier: 4, keywords: ['independent study', 'self-directed', 'research project', 'thesis'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Online courses, MOOCs completed', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Dual enrollment courses, non-selective summer programs', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Selective summer program, college courses with strong grades', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'RSI/SSP/TASP/Ross/PROMYS, published independent research', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Researcher / Program Participant', scoreModifier: 0.0, context: 'Performance and selectivity speak for themselves' },
      { role: 'TA / Peer Mentor (returning)', scoreModifier: 0.5, context: 'Invited back to teach shows exceptional performance' },
    ],
    tiers: {
      1: [
        { activity: 'RSI / SSP / TASP alumnus', scoreRange: [9, 10], context: 'Most selective HS programs in the world', selectivityRatio: 'RSI: ~100/3000 (~3.3%), SSP: 108/~750 (~14%)', subcategory: 'summer_programs', fieldPrestige: 1, keyDifferentiator: 'RSI/SSP tier vs other selective programs' },
        { activity: 'Returning TA/counselor at RSI/SSP/TASP', scoreRange: [9.5, 10], context: 'Invited back to teach shows exceptional past performance', selectivityRatio: '~10-15 returning staff per program', subcategory: 'summer_programs', fieldPrestige: 1, keyDifferentiator: 'Returning to teach vs attending' },
      ],
      2: [
        { activity: 'Ross Mathematics / PROMYS / HCSSiM', scoreRange: [7, 8.5], context: 'Highly selective math programs (10-15% acceptance)', selectivityRatio: '~50-60 per program', subcategory: 'summer_programs', fieldPrestige: 1, keyDifferentiator: 'Selective math camp vs general enrichment' },
        { activity: 'University course with A grade (advanced subject)', scoreRange: [7, 8], context: 'Excelling in college-level coursework', subcategory: 'dual_enrollment', fieldPrestige: 2, keyDifferentiator: 'Advanced subject + A grade vs introductory course' },
        { activity: 'MITES / MOSTEC (MIT program) participant', scoreRange: [7, 8], context: 'MIT engineering program for underrepresented students', selectivityRatio: 'MITES: ~80 of 5,000+ (~1.5%)', subcategory: 'summer_programs', fieldPrestige: 1, keyDifferentiator: 'MITES selectivity comparable to RSI' },
        { activity: 'AP Capstone Diploma with original research', scoreRange: [7, 8], context: 'AP Seminar + AP Research with original scholarly work', subcategory: 'independent_study', fieldPrestige: 2, keyDifferentiator: 'Research component distinguishes from standard AP courses' },
        { activity: 'Academic Decathlon national competitor (individual medal)', scoreRange: [7, 8.5], context: 'Multi-subject academic competition; national individual medalist', selectivityRatio: '~36 teams at nationals; top individuals across 10 events', subcategory: 'independent_study', fieldPrestige: 2, keyDifferentiator: 'National individual medal vs team participation vs state only' },
        { activity: 'Quiz Bowl / NAQT national tournament competitor', scoreRange: [7, 8], context: 'National-level academic trivia competition; demonstrates broad knowledge', selectivityRatio: 'NAQT nationals: ~256 teams from thousands', subcategory: 'independent_study', fieldPrestige: 2, keyDifferentiator: 'National competitor vs state vs school team; individual recognition matters' },
        { activity: 'LaunchX / similar entrepreneurship + enrichment program alumnus', scoreRange: [7, 8], context: 'Selective summer entrepreneurship program combining business + technical skills', selectivityRatio: 'LaunchX: ~100 of 1,000+ applicants (~10%)', subcategory: 'summer_programs', fieldPrestige: 2, keyDifferentiator: 'Selective program with venture output vs enrichment-only program' },
        { activity: 'University course A+ in advanced STEM/humanities (multivariable calc, abstract algebra, etc.)', scoreRange: [7, 8.5], context: 'Excelling in upper-division college coursework', subcategory: 'dual_enrollment', fieldPrestige: 2, keyDifferentiator: 'Upper-division vs introductory; A+ vs B' },
      ],
      3: [
        { activity: 'Dual enrollment (3+ courses, strong grades)', scoreRange: [5.5, 6.5], context: 'Regular college coursework while in high school', subcategory: 'dual_enrollment', fieldPrestige: 3, keyDifferentiator: '3+ courses vs single course' },
        { activity: 'Non-selective but rigorous summer program', scoreRange: [5.5, 6], context: 'Paid programs with academic content', subcategory: 'summer_programs', fieldPrestige: 3, keyDifferentiator: 'Rigorous content vs enrichment tourism' },
        { activity: 'IB Diploma with Extended Essay distinction', scoreRange: [5.5, 6.5], context: 'Extended Essay demonstrates independent research capability', subcategory: 'independent_study', fieldPrestige: 3, keyDifferentiator: 'Extended Essay + full IB Diploma vs individual IB courses' },
        { activity: 'Self-directed research with faculty advisor and documented results', scoreRange: [5.5, 6.5], context: 'Independent research initiative outside formal programs', subcategory: 'independent_study', fieldPrestige: 3, keyDifferentiator: 'Faculty-advised vs unsupervised; documented results' },
        { activity: 'Multiple AP 5 scores (5+ exams)', scoreRange: [5.5, 6.5], context: 'Broad academic excellence across disciplines', subcategory: 'independent_study', fieldPrestige: 3, keyDifferentiator: '5+ AP 5s vs 1-2; breadth of academic mastery' },
      ],
      4: [
        { activity: 'Single dual enrollment course', scoreRange: [4, 5], context: 'One college course; increasingly common', subcategory: 'dual_enrollment', fieldPrestige: 4, keyDifferentiator: 'Single course vs multi-course track' },
        { activity: 'Online course completion (Coursera, edX)', scoreRange: [4, 4.5], context: 'Shows initiative but very accessible', subcategory: 'independent_study', fieldPrestige: 5, keyDifferentiator: 'Completed with certificate vs started only' },
        { activity: 'Pay-to-play university summer program (no selectivity)', scoreRange: [4, 5], context: 'Paid program using university name; no competitive admission', subcategory: 'summer_programs', fieldPrestige: 4, keyDifferentiator: 'Pay-to-attend vs merit-selected; AOs know the difference' },
        { activity: 'AP Scholar with Distinction (avg 3.5+ on 5+ exams, 3+ on all)', scoreRange: [4, 5], context: 'College Board designation; requires avg score of 3.5+ on 5+ AP exams', subcategory: 'independent_study', fieldPrestige: 4, keyDifferentiator: 'Distinction level vs Scholar vs no designation; National AP Scholar discontinued May 2020' },
      ],
      5: [
        { activity: 'Completed one MOOC without certificate', scoreRange: [2.5, 3.5], context: 'Minimal commitment to self-directed learning', subcategory: 'independent_study', fieldPrestige: 5, keyDifferentiator: 'Completed vs started; certificate vs audit' },
      ],
    },
  },

  // ========================================================================
  // 17. INTERNATIONAL
  // ========================================================================
  international: {
    label: 'International Experience',
    keywords: ['international', 'exchange', 'study abroad', 'global', 'cross-cultural', 'language', 'travel', 'foreign'],
    subcategories: [
      { key: 'exchange_programs', name: 'Exchange Programs', prestigeLevel: 2, prestigeContext: 'Competitive exchange programs (NSLI-Y, AFS) valued', typicalTier: 3, keywords: ['exchange', 'study abroad', 'foreign exchange', 'host family'] },
      { key: 'international_competition', name: 'International Competition', prestigeLevel: 1, prestigeContext: 'Representing country in competition is elite', typicalTier: 2, keywords: ['international', 'competition', 'olympiad', 'team', 'represent'] },
      { key: 'global_service', name: 'Global Service', prestigeLevel: 3, prestigeContext: 'Impact and sustainability differentiate from tourism', typicalTier: 4, keywords: ['mission trip', 'service abroad', 'global service', 'international volunteering'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Family travel, tourist-level international exposure', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'School trip abroad, short-term exchange', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: 'Competitive exchange program, sustained cross-cultural project', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: 'National team for international competition, founded cross-cultural org', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Team Member / National Representative', scoreModifier: 0.7, context: 'Selected to represent country' },
      { role: 'Exchange Student / Program Participant', scoreModifier: 0.0, context: 'Selected for competitive program' },
      { role: 'Trip Participant', scoreModifier: -0.5, context: 'Attended without selective process' },
    ],
    tiers: {
      1: [
        { activity: 'National team for international academic competition', scoreRange: [9.5, 10], context: 'Representing country at IMO, IPhO, IBO, IOI', subcategory: 'international_competition', fieldPrestige: 1, keyDifferentiator: 'National team vs participant' },
        { activity: 'Founded international organization operating across countries', scoreRange: [9.5, 10], context: 'Built cross-border org with sustained impact in multiple countries', subcategory: 'global_service', fieldPrestige: 1, keyDifferentiator: 'Multi-country org vs single location; founded vs joined' },
      ],
      2: [
        { activity: 'NSLI-Y or competitive exchange program', scoreRange: [7, 8.5], context: 'Government-sponsored, highly selective language program', selectivityRatio: 'NSLI-Y: ~550 of 3,000-3,500 (~16-18%)', subcategory: 'exchange_programs', fieldPrestige: 1, keyDifferentiator: 'Competitive program vs pay-to-go trip' },
        { activity: 'Founded cross-cultural initiative with sustained impact', scoreRange: [7, 8.5], context: 'Created lasting bridge between communities', subcategory: 'global_service', fieldPrestige: 2, keyDifferentiator: 'Founded initiative vs participated in trip' },
        { activity: 'Semester exchange with sustained cross-cultural project', scoreRange: [7, 8], context: 'Full immersion plus ongoing contribution to host community', subcategory: 'exchange_programs', fieldPrestige: 2, keyDifferentiator: 'Immersion + project vs attendance only' },
        { activity: 'Bilingual interpreter for community organizations (100+ hours)', scoreRange: [7, 8.5], context: 'Heritage fluency applied to serve community; genuine bilingual service', subcategory: 'exchange_programs', fieldPrestige: 1, keyDifferentiator: 'Active interpretation service vs passive fluency' },
        { activity: 'International research collaboration with published results', scoreRange: [7.5, 8.5], context: 'Research partnership with international institution resulting in publication', subcategory: 'international_competition', fieldPrestige: 1, keyDifferentiator: 'Published collaborative results vs correspondence only' },
      ],
      3: [
        { activity: 'Year-long exchange program (AFS, Rotary)', scoreRange: [5.5, 6.5], context: 'Full year abroad shows significant commitment', subcategory: 'exchange_programs', fieldPrestige: 3, keyDifferentiator: 'Year-long vs summer vs week-long' },
        { activity: 'Summer exchange program (4-8 weeks, competitive selection)', scoreRange: [5.5, 6.5], context: 'Selected for summer immersion through competitive process', subcategory: 'exchange_programs', fieldPrestige: 3, keyDifferentiator: 'Competitive summer program vs pay-to-go' },
        { activity: 'Dual language certification (AP Language 5 or heritage speaker credential)', scoreRange: [5.5, 6.5], context: 'Documented advanced proficiency in second language', subcategory: 'exchange_programs', fieldPrestige: 3, keyDifferentiator: 'AP 5 / certified proficiency vs conversational claim' },
        { activity: 'Language proficiency certification (DELF B2+, JLPT N2+, HSK 5+)', scoreRange: [5.5, 6.5], context: 'International language certification demonstrating advanced proficiency', subcategory: 'exchange_programs', fieldPrestige: 3, keyDifferentiator: 'B2/N2/HSK5 = advanced; vs A2/N4/HSK3 = intermediate; standardized credential' },
        { activity: 'Virtual international collaboration with documented outcomes', scoreRange: [5.5, 6], context: 'Cross-border project executed remotely with tangible results', subcategory: 'global_service', fieldPrestige: 3, keyDifferentiator: 'Documented outcomes vs pen-pal style exchange' },
        { activity: 'International service project with sustained local partnership', scoreRange: [5.5, 6.5], context: 'Service abroad with ongoing relationship, not voluntourism', subcategory: 'global_service', fieldPrestige: 3, keyDifferentiator: 'Sustained partnership vs one-time trip' },
      ],
      4: [
        { activity: 'Short-term service trip abroad (1-2 weeks)', scoreRange: [4, 5], context: 'Limited duration; impact often minimal', subcategory: 'global_service', fieldPrestige: 4, keyDifferentiator: 'Short-term trip vs sustained engagement' },
        { activity: 'Short school-organized exchange (1-3 weeks)', scoreRange: [4, 5], context: 'School-facilitated trip with limited immersion depth', subcategory: 'exchange_programs', fieldPrestige: 4, keyDifferentiator: 'School trip vs competitive exchange program' },
        { activity: 'Heritage language class enrollment (weekend/after-school)', scoreRange: [4, 4.5], context: 'Studying heritage language in formal setting', subcategory: 'exchange_programs', fieldPrestige: 4, keyDifferentiator: 'Enrolled student vs certified proficiency' },
        { activity: 'International pen pal / virtual exchange (informal)', scoreRange: [4, 4.5], context: 'Informal cross-cultural connection without structure', subcategory: 'exchange_programs', fieldPrestige: 4, keyDifferentiator: 'Informal exchange vs structured program' },
      ],
      5: [
        { activity: 'Family vacation with cultural exposure', scoreRange: [2.5, 3], context: 'Travel without structured learning or service', subcategory: 'exchange_programs', fieldPrestige: 5, keyDifferentiator: 'Tourism vs structured program' },
        { activity: 'Pay-to-go voluntourism trip (no competitive selection)', scoreRange: [2.5, 3.5], context: 'Commercial trip marketed as service; AOs see through this', subcategory: 'global_service', fieldPrestige: 5, keyDifferentiator: 'Paid voluntourism vs merit-selected program' },
      ],
    },
  },

  // ========================================================================
  // 18. MEDIA & DIGITAL
  // ========================================================================
  media_digital: {
    label: 'Media & Digital Content',
    keywords: ['podcast', 'youtube', 'social media', 'blog', 'content', 'creator', 'channel', 'followers', 'subscribers', 'tiktok', 'instagram'],
    subcategories: [
      { key: 'podcasting', name: 'Podcasting', prestigeLevel: 3, prestigeContext: 'Audience size and episode consistency differentiate', typicalTier: 4, keywords: ['podcast', 'episode', 'host', 'interview', 'audio'] },
      { key: 'youtube', name: 'YouTube / Video Creation', prestigeLevel: 3, prestigeContext: 'Subscriber count and content quality matter', typicalTier: 4, keywords: ['youtube', 'video', 'channel', 'subscriber', 'views'] },
      { key: 'content_creation', name: 'Social Media / Content Creation', prestigeLevel: 4, prestigeContext: 'Must demonstrate skill, not just followers', typicalTier: 5, keywords: ['social media', 'content creator', 'influencer', 'tiktok', 'instagram'] },
    ],
    achievementLadder: [
      { level: 'beginner', description: 'Personal social media, occasional content', typicalScoreRange: [2, 3.5], internalTier: 5 },
      { level: 'developing', description: 'Regular content schedule, small but engaged audience', typicalScoreRange: [4, 5.5], internalTier: 4 },
      { level: 'competitive', description: '1000+ engaged followers, consistent quality content, community impact', typicalScoreRange: [6, 8], internalTier: 3 },
      { level: 'elite', description: '10,000+ followers, monetized, featured in media, measurable community impact', typicalScoreRange: [8.5, 10], internalTier: 2 },
    ],
    roleHierarchy: [
      { role: 'Creator / Host', scoreModifier: 0.5, context: 'Produced and published original content' },
      { role: 'Editor / Producer', scoreModifier: 0.3, context: 'Technical contribution to content' },
      { role: 'Contributor', scoreModifier: 0.0, context: 'Guest or occasional contributor' },
    ],
    tiers: {
      1: [
        { activity: 'Content creator with 100K+ followers and measurable educational/social impact', scoreRange: [9, 10], context: 'Massive audience with documented real-world outcomes (policy change, fundraising, education)', subcategory: 'youtube', fieldPrestige: 1, keyDifferentiator: '100K+ with impact vs large following with no purpose' },
        { activity: 'Original web series/documentary featured in major media', scoreRange: [9, 10], context: 'Professional-quality content recognized by established media outlets', subcategory: 'youtube', fieldPrestige: 1, keyDifferentiator: 'Major media feature vs self-promotion' },
      ],
      2: [
        { activity: 'YouTube channel with 10,000+ subscribers (educational/mission-driven)', scoreRange: [7, 8.5], context: 'Large audience with purposeful content', subcategory: 'youtube', fieldPrestige: 2, keyDifferentiator: '10K+ subscribers vs 1K vs 100' },
        { activity: 'Podcast with 50+ episodes and measurable community impact', scoreRange: [7, 8], context: 'Sustained content creation with real audience', subcategory: 'podcasting', fieldPrestige: 2, keyDifferentiator: '50+ episodes vs 5 episodes; mission-driven vs entertainment' },
        { activity: 'Newsletter/Substack with 5,000+ subscribers', scoreRange: [7, 8], context: 'Written content platform with substantial engaged readership', subcategory: 'content_creation', fieldPrestige: 2, keyDifferentiator: '5K+ subscribers vs 100; email subscribers are high-intent' },
        { activity: 'Monetized content platform (brand partnerships, ad revenue)', scoreRange: [7, 8.5], context: 'External validation through monetization; companies pay for reach', subcategory: 'youtube', fieldPrestige: 2, keyDifferentiator: 'Monetized vs unpaid; brand partners validate audience quality' },
      ],
      3: [
        { activity: 'YouTube/podcast with 1,000+ regular viewers and consistent schedule', scoreRange: [5.5, 6.5], context: 'Growing platform with engaged audience', subcategory: 'youtube', fieldPrestige: 3, keyDifferentiator: '1000+ engaged vs 100 casual followers' },
        { activity: 'Educational content series with documented learning outcomes', scoreRange: [5.5, 6.5], context: 'Content with measurable educational impact', subcategory: 'content_creation', fieldPrestige: 3, keyDifferentiator: 'Educational impact vs entertainment views' },
        { activity: 'TikTok/Instagram educational content with 10K+ followers', scoreRange: [5.5, 6.5], context: 'Short-form educational content with significant engagement', subcategory: 'content_creation', fieldPrestige: 3, keyDifferentiator: 'Educational purpose + engagement vs follower count from algorithm' },
        { activity: 'School media production lead (video announcements, live streaming)', scoreRange: [5.5, 6], context: 'Technical media production for school community', subcategory: 'youtube', fieldPrestige: 3, keyDifferentiator: 'Production lead vs contributor; school-wide reach' },
        { activity: 'Podcast with 20+ episodes and quality guest lineup', scoreRange: [5.5, 6.5], context: 'Consistent publication with external guests showing credibility', subcategory: 'podcasting', fieldPrestige: 3, keyDifferentiator: '20+ episodes with guests vs 5 solo episodes' },
        { activity: 'Technical/coding tutorial channel with community following', scoreRange: [5.5, 6.5], context: 'Teaching technical skills to online audience', subcategory: 'content_creation', fieldPrestige: 3, keyDifferentiator: 'Skill-teaching content vs entertainment; community engagement' },
      ],
      4: [
        { activity: 'Personal blog/channel with small audience', scoreRange: [4, 5], context: 'Shows initiative but limited reach', subcategory: 'content_creation', fieldPrestige: 4, keyDifferentiator: 'Regular posting vs occasional content' },
        { activity: 'New podcast/channel with <20 episodes, growing audience', scoreRange: [4, 5], context: 'Early-stage content creation with commitment shown', subcategory: 'podcasting', fieldPrestige: 4, keyDifferentiator: 'Active growth vs stalled project' },
        { activity: 'School newspaper digital edition editor', scoreRange: [4, 5], context: 'Digital media management for school publication', subcategory: 'content_creation', fieldPrestige: 4, keyDifferentiator: 'Editor role vs contributor' },
        { activity: 'Photography/art portfolio website', scoreRange: [4, 4.5], context: 'Online portfolio showing creative work', subcategory: 'content_creation', fieldPrestige: 4, keyDifferentiator: 'Curated portfolio vs random posts' },
        { activity: 'Twitch streaming with small engaged community', scoreRange: [4, 5], context: 'Live streaming with regular viewers; requires consistency', subcategory: 'content_creation', fieldPrestige: 4, keyDifferentiator: 'Regular streaming schedule vs occasional broadcasts' },
      ],
      5: [
        { activity: 'Casual social media posting', scoreRange: [2.5, 3], context: 'Personal use without content creation intent', subcategory: 'content_creation', fieldPrestige: 5, keyDifferentiator: 'Personal posts vs purposeful content' },
        { activity: 'Abandoned content project (started but not sustained)', scoreRange: [2.5, 3], context: 'Started podcast/channel but stopped after few posts', subcategory: 'content_creation', fieldPrestige: 5, keyDifferentiator: 'Abandoned vs sustained; shows lack of commitment' },
      ],
    },
  },
};

// ============================================================================
// INDEX MAPS (pre-built for O(1) lookup)
// ============================================================================

/** Category keyword index for fast matching */
const _categoryKeywordIndex: Map<string, string[]> = new Map();

/** Subcategory keyword index for fast matching */
const _subcategoryKeywordIndex: Map<string, { category: string; subcategory: string }[]> = new Map();

/** Build index maps on module load */
function buildIndexes(): void {
  for (const [catKey, category] of Object.entries(ACHIEVEMENT_DATABASE)) {
    // Index category keywords
    for (const keyword of category.keywords) {
      const lower = keyword.toLowerCase();
      if (!_categoryKeywordIndex.has(lower)) {
        _categoryKeywordIndex.set(lower, []);
      }
      _categoryKeywordIndex.get(lower)!.push(catKey);
    }

    // Index subcategory keywords
    for (const sub of category.subcategories) {
      for (const keyword of sub.keywords) {
        const lower = keyword.toLowerCase();
        if (!_subcategoryKeywordIndex.has(lower)) {
          _subcategoryKeywordIndex.set(lower, []);
        }
        _subcategoryKeywordIndex.get(lower)!.push({ category: catKey, subcategory: sub.key });
      }
    }
  }
}

// Build indexes on module load
buildIndexes();

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Get category keyword index for fast matching.
 */
export function getCategoryKeywordIndex(): ReadonlyMap<string, string[]> {
  return _categoryKeywordIndex;
}

/**
 * Get subcategory keyword index for fast matching.
 */
export function getSubcategoryKeywordIndex(): ReadonlyMap<string, { category: string; subcategory: string }[]> {
  return _subcategoryKeywordIndex;
}

/**
 * Get a specific category from the database.
 */
export function getAchievementCategory(key: string): AchievementCategory | undefined {
  return ACHIEVEMENT_DATABASE[key];
}

/**
 * Get all category keys.
 */
export function getAchievementCategoryKeys(): string[] {
  return Object.keys(ACHIEVEMENT_DATABASE);
}

/**
 * Get entries for a specific category and tier.
 */
export function getEntriesForTier(categoryKey: string, tier: InternalTier): AchievementEntry[] {
  return ACHIEVEMENT_DATABASE[categoryKey]?.tiers[tier] ?? [];
}

/**
 * Get subcategory profile by key.
 */
export function getSubcategoryProfile(categoryKey: string, subcategoryKey: string): SubcategoryProfile | undefined {
  return ACHIEVEMENT_DATABASE[categoryKey]?.subcategories.find(s => s.key === subcategoryKey);
}

/**
 * Count total entries across all categories and tiers.
 */
export function getTotalEntryCount(): number {
  let count = 0;
  for (const category of Object.values(ACHIEVEMENT_DATABASE)) {
    for (const entries of Object.values(category.tiers)) {
      if (entries) count += entries.length;
    }
  }
  return count;
}
