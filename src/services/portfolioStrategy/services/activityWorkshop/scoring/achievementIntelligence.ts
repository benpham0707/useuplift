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
        { activity: 'RSI (Research Science Institute) alum', scoreRange: [9.5, 10], context: '80 selected from 3,000+ globally; MIT-hosted', selectivityRatio: '80 of 3,000+ (2.7%)', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'Most selective HS research program in the world' },
        { activity: 'Regeneron STS finalist', scoreRange: [9.5, 10], context: '40 finalists from ~1,900 applicants', selectivityRatio: '40 of 1,900 (2.1%)', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'Often called junior Nobel Prize' },
        { activity: 'Published computational research with novel algorithm', scoreRange: [9, 10], context: 'Developing new algorithms as HS student is exceptionally rare', subcategory: 'computational', fieldPrestige: 1, keyDifferentiator: 'Novel algorithmic contribution vs applying existing tools' },
      ],
      2: [
        { activity: 'Named co-author on faculty publication', scoreRange: [7.5, 8.5], context: 'Faculty add names for genuine contribution, not attendance', subcategory: 'bench_science', fieldPrestige: 1, keyDifferentiator: 'Co-author vs acknowledgment section' },
        { activity: 'Multi-year university lab placement with original project', scoreRange: [7, 8.5], context: 'Sustained research over 1+ years with documented methodology', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Duration + independence distinguish from summer programs' },
        { activity: 'Competitive summer research program (SSP, COSMOS, Clark Scholar)', scoreRange: [7, 8], context: 'Selective programs (5-15% acceptance) validate research potential', selectivityRatio: 'SSP: 100 of 1,500+ (6.7%)', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Program selectivity serves as external validation' },
        { activity: 'Presented original research at regional/state conference', scoreRange: [7, 8], context: 'Peer-reviewed presentation shows work withstood scrutiny', subcategory: 'bench_science', fieldPrestige: 2, keyDifferentiator: 'Conference presentation vs poster session' },
        { activity: 'IRB-approved clinical research project', scoreRange: [7.5, 8.5], context: 'IRB approval is a significant barrier for HS students', subcategory: 'clinical_trials', fieldPrestige: 1, keyDifferentiator: 'IRB approval signals real clinical involvement' },
        { activity: 'ML/AI project with published results or competition win', scoreRange: [7, 8.5], context: 'Applied ML with measurable results on real data', subcategory: 'computational', fieldPrestige: 1, keyDifferentiator: 'Novel application vs tutorial replication' },
      ],
      3: [
        { activity: 'Summer lab intern with assigned tasks', scoreRange: [5.5, 6.5], context: 'Common among top-school applicants; describe YOUR contribution', subcategory: 'bench_science', fieldPrestige: 3, keyDifferentiator: 'Assigned tasks vs self-directed inquiry' },
        { activity: 'School science fair project (state level)', scoreRange: [5.5, 6.5], context: 'State fair participation is competitive but not rare', subcategory: 'bench_science', fieldPrestige: 3, keyDifferentiator: 'State-level competition vs school-only fair' },
        { activity: 'Independent computational project with real data', scoreRange: [5.5, 6.5], context: 'Self-directed data science on real problems shows initiative', subcategory: 'computational', fieldPrestige: 3, keyDifferentiator: 'Real data vs textbook exercises' },
        { activity: 'Hospital chart review / data collection assistant', scoreRange: [5.5, 6], context: 'Low autonomy but real clinical exposure', subcategory: 'clinical_trials', fieldPrestige: 4, keyDifferentiator: 'Data collection vs analysis vs interpretation' },
      ],
      4: [
        { activity: 'Lab shadowing / observation only', scoreRange: [4, 5], context: 'Watching without contributing; common but low impact', subcategory: 'bench_science', fieldPrestige: 5, keyDifferentiator: 'Observation vs hands-on participation' },
        { activity: 'School science fair (local only, no advancement)', scoreRange: [4, 4.5], context: 'Participation without competitive advancement', subcategory: 'bench_science', fieldPrestige: 4, keyDifferentiator: 'Local-only vs advancing to regionals/state' },
      ],
      5: [
        { activity: 'Science club member with no projects', scoreRange: [2.5, 3.5], context: 'Club membership without active research contribution', subcategory: 'bench_science', fieldPrestige: 5, keyDifferentiator: 'Attendance vs active project work' },
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
        { activity: 'USACO Platinum division', scoreRange: [9, 10], context: 'Top ~200 competitive programmers nationally', selectivityRatio: '~200 of 10,000+ active', subcategory: 'informatics', fieldPrestige: 1, keyDifferentiator: 'Platinum requires graduate-level algorithmic knowledge' },
        { activity: 'ISEF Grand Award winner', scoreRange: [9.5, 10], context: 'Top project among ~1,800 finalists from 80+ countries', selectivityRatio: '~300 awards of 1,800 finalists', subcategory: 'science_fair', fieldPrestige: 1, keyDifferentiator: 'Grand Award vs participation/special award' },
        { activity: 'USAPhO semifinalist / IPhO team', scoreRange: [9.5, 10], context: 'Top 200 physics students nationally', selectivityRatio: '20 semifinalists, 5 team members', subcategory: 'physics', fieldPrestige: 1, keyDifferentiator: 'Semifinalist vs qualifier distinction' },
        { activity: 'USABO finalist / IBO team', scoreRange: [9.5, 10], context: 'Top 20 biology students nationally', selectivityRatio: '20 finalists of 10,000+', subcategory: 'biology', fieldPrestige: 1, keyDifferentiator: 'National camp invitee' },
      ],
      2: [
        { activity: 'AIME qualifier (high score 10+)', scoreRange: [7.5, 8.5], context: 'Top 2% of AMC takers; 10+ score is state-elite', selectivityRatio: '~6,000 of 300,000+ (2%)', subcategory: 'math', fieldPrestige: 2, keyDifferentiator: 'AIME score of 10+ vs bare qualifier' },
        { activity: 'USACO Gold division', scoreRange: [7, 8.5], context: 'Top ~1,000 competitive programmers', subcategory: 'informatics', fieldPrestige: 2, keyDifferentiator: 'Gold requires strong algorithmic fundamentals' },
        { activity: 'State Science Olympiad medalist (individual event)', scoreRange: [7, 8], context: 'Top 3 in state; teams have 200+ competing schools', subcategory: 'science_olympiad', fieldPrestige: 2, keyDifferentiator: 'Individual medal vs team placement' },
        { activity: 'Regional ISEF qualifier', scoreRange: [7, 8], context: 'Winning regional fair to advance to ISEF', selectivityRatio: '~10% of regional entries advance', subcategory: 'science_fair', fieldPrestige: 2, keyDifferentiator: 'ISEF qualification vs regional-only fair' },
        { activity: 'F=MA exam qualifier (USAPhO)', scoreRange: [7, 8], context: 'Top 400 physics students qualify for USAPhO', subcategory: 'physics', fieldPrestige: 2, keyDifferentiator: 'Qualifying for USAPhO exam round' },
      ],
      3: [
        { activity: 'AIME qualifier (bare cutoff)', scoreRange: [5.5, 6.5], context: 'Qualified but low AIME score; strong but not elite', subcategory: 'math', fieldPrestige: 3, keyDifferentiator: 'Bare qualifier vs high scorer' },
        { activity: 'USACO Silver division', scoreRange: [5.5, 6.5], context: 'Above-average programmer; thousands reach this level', subcategory: 'informatics', fieldPrestige: 3, keyDifferentiator: 'Silver is common among competitive students' },
        { activity: 'Science Olympiad state team member (no individual medal)', scoreRange: [5.5, 6], context: 'Team competition at state level without individual distinction', subcategory: 'science_olympiad', fieldPrestige: 3, keyDifferentiator: 'Team member vs individual medalist' },
        { activity: 'AMC Honor Roll (top 5%)', scoreRange: [5.5, 6], context: 'Top 5% nationally but below AIME cutoff', subcategory: 'math', fieldPrestige: 3, keyDifferentiator: 'Honor roll vs AIME qualifier' },
      ],
      4: [
        { activity: 'School math team member', scoreRange: [4, 5], context: '5-10% of students at competitive schools', subcategory: 'math', fieldPrestige: 4, keyDifferentiator: 'School-level without external competition results' },
        { activity: 'Local hackathon participant (no win)', scoreRange: [4, 5], context: 'Good initiative but without outcomes', subcategory: 'informatics', fieldPrestige: 4, keyDifferentiator: 'Participation without placing' },
        { activity: 'USACO Bronze division', scoreRange: [4, 5], context: 'Entry-level competitive programming', subcategory: 'informatics', fieldPrestige: 4, keyDifferentiator: 'Bronze is the starting division' },
      ],
      5: [
        { activity: 'Science club member (no competitions)', scoreRange: [2.5, 3.5], context: 'Passive membership without competitive engagement', subcategory: 'science_olympiad', fieldPrestige: 5, keyDifferentiator: 'Club attendance vs competition participation' },
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
        { activity: 'NSDA National Champion', scoreRange: [9.5, 10], context: 'Single national champion in each event', selectivityRatio: '1 of ~6,000 qualifiers', subcategory: 'ld_debate', fieldPrestige: 1, keyDifferentiator: 'Champion vs qualifier' },
      ],
      2: [
        { activity: 'TOC qualifier (2+ bids)', scoreRange: [7.5, 8.5], context: 'Consistently winning at championship-level tournaments', subcategory: 'policy_debate', fieldPrestige: 1, keyDifferentiator: 'Multiple bids vs single bid' },
        { activity: 'State debate champion', scoreRange: [7, 8.5], context: 'Top debater in state; represents ~1,000+ competitors', subcategory: 'ld_debate', fieldPrestige: 2, keyDifferentiator: 'State champion vs state qualifier' },
        { activity: 'NSDA Nationals qualifier (elimination rounds)', scoreRange: [7, 8], context: 'Qualifying and advancing at nationals', subcategory: 'public_forum', fieldPrestige: 2, keyDifferentiator: 'Elimination round advancement vs attendance' },
        { activity: 'State Mock Trial champion team (key role)', scoreRange: [7, 8], context: 'Attorney or key witness role on winning team', subcategory: 'mock_trial', fieldPrestige: 2, keyDifferentiator: 'Key role vs ensemble member' },
        { activity: 'Best Delegate at major MUN conference', scoreRange: [7, 8], context: 'Top delegate at conferences like HMUN, YMUN', subcategory: 'model_un', fieldPrestige: 2, keyDifferentiator: 'Major conference vs local conference award' },
      ],
      3: [
        { activity: 'Regular tournament competitor with state-level results', scoreRange: [5.5, 6.5], context: 'Consistent competitor reaching elimination rounds', subcategory: 'ld_debate', fieldPrestige: 3, keyDifferentiator: 'Elimination rounds vs preliminary rounds only' },
        { activity: 'MUN conference award (local/regional)', scoreRange: [5.5, 6], context: 'Awards at local conferences are less distinguishing', subcategory: 'model_un', fieldPrestige: 3, keyDifferentiator: 'Local conference vs HMUN/YMUN caliber' },
        { activity: 'School debate team varsity member', scoreRange: [5.5, 6], context: 'Active competitor without championship results', subcategory: 'public_forum', fieldPrestige: 3, keyDifferentiator: 'Varsity member vs champion' },
      ],
      4: [
        { activity: 'MUN club member (1-2 conferences/year)', scoreRange: [4, 5], context: 'Very common; needs awards or leadership to stand out', subcategory: 'model_un', fieldPrestige: 4, keyDifferentiator: 'Casual participation vs competitive delegation' },
        { activity: 'Novice debate competitor', scoreRange: [4, 4.5], context: 'First-year competitors learning the activity', subcategory: 'public_forum', fieldPrestige: 4, keyDifferentiator: 'Novice division vs open/varsity' },
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
        { activity: 'National YoungArts Finalist', scoreRange: [9.5, 10], context: '~170 finalists from 12,000+ applicants annually', selectivityRatio: '170 of 12,000 (1.4%)', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'Finalist vs honorable mention vs merit' },
        { activity: 'Professional orchestra/company member', scoreRange: [9, 10], context: 'Performing with adult professionals as a teenager', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'Professional ensemble vs youth orchestra' },
        { activity: 'International music competition finalist', scoreRange: [9, 10], context: 'Competitions like Menuhin, Tchaikovsky Junior', subcategory: 'instrumental_classical', fieldPrestige: 1, keyDifferentiator: 'International vs national vs regional competition' },
      ],
      2: [
        { activity: 'All-State orchestra/band/choir (competitive state)', scoreRange: [7, 8.5], context: 'Top ~100 musicians statewide in competitive states', subcategory: 'instrumental_classical', fieldPrestige: 2, keyDifferentiator: 'All-State in CA/NY/TX vs small state' },
        { activity: 'Lead role in school musical/play (competitive program)', scoreRange: [7, 8], context: 'Competitive theater programs with audition processes', subcategory: 'theater_acting', fieldPrestige: 2, keyDifferentiator: 'Lead vs supporting vs ensemble role' },
        { activity: 'Regional/state dance company soloist', scoreRange: [7, 8], context: 'Selected as soloist through competitive audition', subcategory: 'dance', fieldPrestige: 2, keyDifferentiator: 'Soloist vs corps dancer' },
        { activity: 'Film screened at recognized festival', scoreRange: [7, 8.5], context: 'Festival selection provides external validation', subcategory: 'film', fieldPrestige: 2, keyDifferentiator: 'Recognized festival vs open screening' },
      ],
      3: [
        { activity: 'All-County/Regional honors ensemble', scoreRange: [5.5, 6.5], context: 'Good but significantly more common than All-State', subcategory: 'instrumental_classical', fieldPrestige: 3, keyDifferentiator: 'County/regional vs state-level selection' },
        { activity: 'Supporting role in school productions', scoreRange: [5.5, 6], context: 'Active participant but not featured performer', subcategory: 'theater_acting', fieldPrestige: 3, keyDifferentiator: 'Named supporting role vs chorus/ensemble' },
        { activity: 'Local dance competition awards', scoreRange: [5.5, 6], context: 'Competition participation shows dedication', subcategory: 'dance', fieldPrestige: 3, keyDifferentiator: 'Competition vs recital performance' },
      ],
      4: [
        { activity: 'School ensemble member (no selection/audition)', scoreRange: [4, 5], context: 'Participation-based with no competitive distinction', subcategory: 'instrumental_classical', fieldPrestige: 4, keyDifferentiator: 'Non-auditioned vs auditioned ensemble' },
        { activity: 'School play ensemble/chorus', scoreRange: [4, 4.5], context: 'Participation without featured role', subcategory: 'theater_acting', fieldPrestige: 4, keyDifferentiator: 'Ensemble cast member without lines' },
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
        { activity: 'State meet qualifier with top-10 finish', scoreRange: [7, 8], context: 'Competing and placing well at state level', subcategory: 'individual_olympic', fieldPrestige: 2, keyDifferentiator: 'Top-10 finish vs participation' },
        { activity: 'National-level martial arts competitor (black belt)', scoreRange: [7, 8], context: 'Competition at national level shows elite commitment', subcategory: 'martial_arts', fieldPrestige: 2, keyDifferentiator: 'National competition vs local tournaments' },
      ],
      3: [
        { activity: 'All-Conference/All-District (varsity captain)', scoreRange: [5.5, 6.5], context: 'Strong school-level athlete with regional recognition', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Conference vs district vs league recognition' },
        { activity: 'Varsity starter (3+ years)', scoreRange: [5.5, 6], context: 'Sustained varsity commitment shows discipline', subcategory: 'team_sport', fieldPrestige: 3, keyDifferentiator: 'Multi-year starter vs single season' },
        { activity: 'Black belt earned (competitive martial arts)', scoreRange: [5.5, 6.5], context: 'Demonstrating years of dedicated training', subcategory: 'martial_arts', fieldPrestige: 3, keyDifferentiator: 'Competitive sparring vs forms-only testing' },
      ],
      4: [
        { activity: 'Varsity team member (1-2 years)', scoreRange: [4, 5], context: 'Participation shows commitment but limited distinction', subcategory: 'team_sport', fieldPrestige: 4, keyDifferentiator: 'Varsity vs JV distinction' },
        { activity: 'Club/travel team member', scoreRange: [4, 5], context: 'Travel teams are common; results matter', subcategory: 'club_sport', fieldPrestige: 4, keyDifferentiator: 'Travel team with wins vs participation only' },
      ],
      5: [
        { activity: 'JV or recreational team member', scoreRange: [2.5, 3.5], context: 'Shows interest but no competitive distinction', subcategory: 'team_sport', fieldPrestige: 5, keyDifferentiator: 'JV is expected, not distinguishing' },
        { activity: 'Casual esports participation', scoreRange: [2.5, 3], context: 'Without scholarship-level competitive results', subcategory: 'esports', fieldPrestige: 5, keyDifferentiator: 'Ranked play vs casual gaming' },
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
      ],
      2: [
        { activity: 'Founded sustainable community program (100+ beneficiaries)', scoreRange: [7, 8.5], context: 'Program continues beyond personal involvement', subcategory: 'program_creation', fieldPrestige: 2, keyDifferentiator: 'Sustainable program vs one-time event' },
        { activity: 'Led fundraising campaign raising $10,000+', scoreRange: [7, 8], context: 'Significant fundraising with clear allocation', subcategory: 'fundraising', fieldPrestige: 2, keyDifferentiator: '$10K+ vs $1K vs $100 raised' },
        { activity: 'Multi-year mentoring with documented student improvement', scoreRange: [7, 8], context: 'Sustained mentoring with measurable outcomes', subcategory: 'mentoring', fieldPrestige: 2, keyDifferentiator: 'Documented outcomes vs hours logged' },
      ],
      3: [
        { activity: 'Regular volunteer at established organization (200+ hours)', scoreRange: [5.5, 6.5], context: 'Commitment to existing program with growing responsibility', subcategory: 'direct_service', fieldPrestige: 3, keyDifferentiator: '200+ hours vs minimum required hours' },
        { activity: 'Organized school service event (50+ participants)', scoreRange: [5.5, 6.5], context: 'One-time event organization shows initiative', subcategory: 'program_creation', fieldPrestige: 3, keyDifferentiator: 'Organized vs participated in event' },
      ],
      4: [
        { activity: 'Regular volunteer (50-100 hours/year)', scoreRange: [4, 5], context: 'Consistent but not distinguished by impact or leadership', subcategory: 'direct_service', fieldPrestige: 4, keyDifferentiator: 'Regular schedule vs sporadic attendance' },
        { activity: 'NHS / service club required hours', scoreRange: [4, 4.5], context: 'Meeting minimum requirements for honor society', subcategory: 'direct_service', fieldPrestige: 4, keyDifferentiator: 'Required minimum vs voluntary excess' },
      ],
      5: [
        { activity: 'One-time service event participation', scoreRange: [2.5, 3.5], context: 'Single event without sustained commitment', subcategory: 'direct_service', fieldPrestige: 5, keyDifferentiator: 'One-time vs regular vs founding' },
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
        { activity: 'VC-backed startup or venture with $10K+ revenue', scoreRange: [9, 10], context: 'External validation through investment or significant revenue', subcategory: 'tech_startup', fieldPrestige: 1, keyDifferentiator: 'VC investment vs self-funded vs no revenue' },
        { activity: 'DECA/FBLA National Champion', scoreRange: [9, 10], context: 'Top competitor at national business competition', selectivityRatio: '~1 of 200,000+ DECA members', subcategory: 'business_competition', fieldPrestige: 1, keyDifferentiator: 'National champion vs state champion' },
      ],
      2: [
        { activity: 'Launched product/service with paying customers (50+)', scoreRange: [7, 8.5], context: 'Real customers validate product-market fit', subcategory: 'tech_startup', fieldPrestige: 2, keyDifferentiator: 'Paying customers vs free users vs no users' },
        { activity: 'Social enterprise serving 200+ beneficiaries', scoreRange: [7, 8], context: 'Mission-driven with measurable community impact', subcategory: 'social_enterprise', fieldPrestige: 2, keyDifferentiator: 'Sustained impact vs one-time drive' },
        { activity: 'DECA/FBLA State Champion (advancing to nationals)', scoreRange: [7, 8], context: 'State-level business competition success', subcategory: 'business_competition', fieldPrestige: 2, keyDifferentiator: 'State champion vs qualifier' },
      ],
      3: [
        { activity: 'Small business with some revenue (<$1K)', scoreRange: [5.5, 6.5], context: 'Demonstrates initiative even if scale is modest', subcategory: 'small_business', fieldPrestige: 3, keyDifferentiator: 'Any revenue vs ideas only' },
        { activity: 'DECA/FBLA regional competitor', scoreRange: [5.5, 6], context: 'Active participation in business competitions', subcategory: 'business_competition', fieldPrestige: 3, keyDifferentiator: 'Regional placement vs participation' },
      ],
      4: [
        { activity: 'Business club officer without venture', scoreRange: [4, 5], context: 'Leadership in club but no hands-on entrepreneurship', subcategory: 'business_competition', fieldPrestige: 4, keyDifferentiator: 'Club leadership vs actual business' },
        { activity: 'Business idea/plan without execution', scoreRange: [4, 4.5], context: 'Ideas without execution show interest but not ability', subcategory: 'tech_startup', fieldPrestige: 5, keyDifferentiator: 'Executed vs planned vs imagined' },
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
        { activity: 'FRC Dean\'s List Finalist (national)', scoreRange: [9, 10], context: 'Top student leader across all FRC teams nationally', selectivityRatio: '10 of 100,000+ participants', subcategory: 'robotics', fieldPrestige: 1, keyDifferentiator: 'National finalist vs semi-finalist vs regional' },
      ],
      2: [
        { activity: 'Published app/tool with 500+ users', scoreRange: [7, 8.5], context: 'Real users validate technical and product skill', subcategory: 'software_dev', fieldPrestige: 2, keyDifferentiator: '500+ users vs concept vs no deployment' },
        { activity: 'Accepted PR to major open source project', scoreRange: [7, 8.5], context: 'Code review by professional developers', subcategory: 'open_source', fieldPrestige: 1, keyDifferentiator: 'Major project (React, Linux) vs small library' },
        { activity: 'FRC team technical lead (regional award winner)', scoreRange: [7, 8], context: 'Led engineering on competitive robot', subcategory: 'robotics', fieldPrestige: 2, keyDifferentiator: 'Technical lead with award vs team member' },
        { activity: 'CTF national competition placement', scoreRange: [7, 8], context: 'Top finisher in cybersecurity competition', subcategory: 'cybersecurity', fieldPrestige: 2, keyDifferentiator: 'National placement vs participation' },
      ],
      3: [
        { activity: 'Personal project deployed with some users', scoreRange: [5.5, 6.5], context: 'Built and shipped a product; limited traction', subcategory: 'software_dev', fieldPrestige: 3, keyDifferentiator: 'Deployed vs GitHub-only vs tutorial' },
        { activity: 'FRC team member (contributing role)', scoreRange: [5.5, 6], context: 'Active team member with specific contributions', subcategory: 'robotics', fieldPrestige: 3, keyDifferentiator: 'Specific role vs general member' },
        { activity: 'Personal AI/ML project with novel application', scoreRange: [5.5, 6.5], context: 'Applied ML to new problem (not copied tutorial)', subcategory: 'ai_ml', fieldPrestige: 3, keyDifferentiator: 'Novel application vs replicating tutorial' },
      ],
      4: [
        { activity: 'Coding club member, personal GitHub projects', scoreRange: [4, 5], context: 'Shows interest; needs deployment/users to stand out', subcategory: 'software_dev', fieldPrestige: 4, keyDifferentiator: 'Active GitHub vs empty profile' },
        { activity: 'FRC team general member', scoreRange: [4, 5], context: 'On team but without specific technical role', subcategory: 'robotics', fieldPrestige: 4, keyDifferentiator: 'General member vs specific role' },
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
        { activity: 'Scholastic Art & Writing Awards National Gold Medal', scoreRange: [9, 10], context: 'Most prestigious HS writing recognition', selectivityRatio: '~500 national medals from 350,000+ submissions', subcategory: 'fiction', fieldPrestige: 1, keyDifferentiator: 'National Gold Medal vs Silver vs regional award' },
        { activity: 'Published in nationally recognized outlet (NYT, Atlantic)', scoreRange: [9.5, 10], context: 'Professional-level publication while in high school', subcategory: 'journalism', fieldPrestige: 1, keyDifferentiator: 'National publication vs local/school' },
      ],
      2: [
        { activity: 'Scholastic Regional Gold Key with publication', scoreRange: [7, 8.5], context: 'Top regional recognition; strong but below national', subcategory: 'fiction', fieldPrestige: 2, keyDifferentiator: 'Gold Key vs Silver Key vs Honorable Mention' },
        { activity: 'School newspaper Editor-in-Chief (award-winning paper)', scoreRange: [7, 8], context: 'Leading publication that wins NSPA/CSPA awards', subcategory: 'journalism', fieldPrestige: 2, keyDifferentiator: 'Award-winning paper vs typical school newspaper' },
        { activity: 'Published in literary journal/magazine', scoreRange: [7, 8], context: 'External publication beyond school', subcategory: 'fiction', fieldPrestige: 2, keyDifferentiator: 'External literary journal vs school literary magazine' },
      ],
      3: [
        { activity: 'School newspaper section editor', scoreRange: [5.5, 6.5], context: 'Editorial leadership without top position', subcategory: 'journalism', fieldPrestige: 3, keyDifferentiator: 'Section editor vs EIC vs staff writer' },
        { activity: 'Scholastic Honorable Mention / Silver Key', scoreRange: [5.5, 6.5], context: 'Recognition without top award', subcategory: 'fiction', fieldPrestige: 3, keyDifferentiator: 'Regional recognition vs no competition entry' },
      ],
      4: [
        { activity: 'School newspaper staff writer', scoreRange: [4, 5], context: 'Active contributor but limited leadership', subcategory: 'journalism', fieldPrestige: 4, keyDifferentiator: 'Regular contributor vs occasional writer' },
        { activity: 'Personal blog / creative writing hobby', scoreRange: [4, 4.5], context: 'Shows passion without external validation', subcategory: 'fiction', fieldPrestige: 4, keyDifferentiator: 'Regular posting vs dormant blog' },
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
      2: [
        { activity: 'Founded school organization that grew to 50+ members', scoreRange: [7, 8.5], context: 'Creating something lasting that others join', subcategory: 'organization_founding', fieldPrestige: 1, keyDifferentiator: '50+ members vs 10 members vs never launched' },
        { activity: 'Student body president with measurable initiatives', scoreRange: [7, 8], context: 'Elected + implemented real policy changes', subcategory: 'student_government', fieldPrestige: 2, keyDifferentiator: 'Implemented initiatives vs held title only' },
        { activity: 'State-level youth government delegate', scoreRange: [7, 8], context: 'Selected to represent school/district at state level', subcategory: 'student_government', fieldPrestige: 2, keyDifferentiator: 'State delegation vs school-only' },
      ],
      3: [
        { activity: 'Student body president (standard impact)', scoreRange: [5.5, 6.5], context: 'Elected but without measurable policy impact', subcategory: 'student_government', fieldPrestige: 3, keyDifferentiator: 'Title holder vs change maker' },
        { activity: 'Club president with event organization', scoreRange: [5.5, 6.5], context: 'Managed club activities and events', subcategory: 'club_leadership', fieldPrestige: 3, keyDifferentiator: 'Active programming vs meeting-only club' },
      ],
      4: [
        { activity: 'Club officer (VP/Secretary)', scoreRange: [4, 5], context: 'Supporting leadership without primary responsibility', subcategory: 'club_leadership', fieldPrestige: 4, keyDifferentiator: 'VP vs Secretary vs Treasurer roles' },
        { activity: 'Class representative', scoreRange: [4, 5], context: 'Elected but limited scope', subcategory: 'student_government', fieldPrestige: 4, keyDifferentiator: 'Class rep vs student body officer' },
      ],
      5: [
        { activity: 'NHS member (no officer role)', scoreRange: [2.5, 3.5], context: 'GPA-based membership alone is not distinguishing', subcategory: 'honor_societies', fieldPrestige: 5, keyDifferentiator: 'NHS membership vs NHS officer vs NHS founder of initiative' },
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
      2: [
        { activity: 'Published health research with clinical relevance', scoreRange: [7.5, 8.5], context: 'Research directly applicable to patient care', subcategory: 'research', fieldPrestige: 1, keyDifferentiator: 'Published vs presented vs completed' },
        { activity: 'Active EMT with 100+ emergency calls', scoreRange: [7, 8.5], context: 'Real emergency medical experience as a teenager', subcategory: 'emt_ems', fieldPrestige: 1, keyDifferentiator: 'Active duty with calls vs certification only' },
        { activity: 'Founded health screening program (500+ screened)', scoreRange: [7, 8], context: 'Created lasting public health infrastructure', subcategory: 'public_health', fieldPrestige: 1, keyDifferentiator: 'Program creation vs volunteer at existing program' },
      ],
      3: [
        { activity: 'EMT certified with some volunteer shifts', scoreRange: [5.5, 6.5], context: 'Certification is impressive; limited field experience', subcategory: 'emt_ems', fieldPrestige: 3, keyDifferentiator: 'Certified + some shifts vs certification alone' },
        { activity: 'Hospital volunteer with 200+ hours, patient interaction', scoreRange: [5.5, 6.5], context: 'Sustained clinical volunteering beyond the minimum', subcategory: 'clinical_volunteering', fieldPrestige: 3, keyDifferentiator: '200+ hours with patient interaction vs gift shop' },
        { activity: 'Mental health awareness campaign (school-wide)', scoreRange: [5.5, 6.5], context: 'Organized awareness program with measurable reach', subcategory: 'mental_health', fieldPrestige: 3, keyDifferentiator: 'School-wide campaign vs personal blog' },
      ],
      4: [
        { activity: 'Hospital volunteer (standard, 50-100 hours)', scoreRange: [4, 5], context: 'Very common pre-med activity; hours matter', subcategory: 'clinical_volunteering', fieldPrestige: 4, keyDifferentiator: 'Standard volunteer vs specialized role' },
        { activity: 'CPR/First Aid certified', scoreRange: [4, 4.5], context: 'Useful skill but not distinguishing', subcategory: 'emt_ems', fieldPrestige: 5, keyDifferentiator: 'CPR cert vs EMT cert vs active EMT' },
      ],
      5: [
        { activity: 'Medical shadowing (observation only)', scoreRange: [2.5, 3.5], context: 'Watching without contributing; extremely common', subcategory: 'clinical_volunteering', fieldPrestige: 5, keyDifferentiator: 'Shadowing vs volunteering vs research' },
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
        { activity: 'Scholastic Art Awards National Gold Medal', scoreRange: [9, 10], context: 'Most prestigious HS art recognition', selectivityRatio: '~800 national medals from 350,000+ entries', subcategory: 'fine_art', fieldPrestige: 1, keyDifferentiator: 'National Gold vs Silver vs regional' },
      ],
      2: [
        { activity: 'Scholastic Regional Gold Key with exhibition', scoreRange: [7, 8.5], context: 'Top regional recognition; strong portfolio piece', subcategory: 'fine_art', fieldPrestige: 2, keyDifferentiator: 'Gold Key vs Silver Key vs Honorable Mention' },
        { activity: 'Gallery exhibition (juried, non-school)', scoreRange: [7, 8], context: 'Selected by professional curator for external gallery', subcategory: 'fine_art', fieldPrestige: 2, keyDifferentiator: 'Juried gallery vs open show vs school gallery' },
      ],
      3: [
        { activity: 'Scholastic Silver Key / Honorable Mention', scoreRange: [5.5, 6.5], context: 'Recognition without top award', subcategory: 'fine_art', fieldPrestige: 3, keyDifferentiator: 'Regional recognition tier' },
        { activity: 'Published photography or paid design work', scoreRange: [5.5, 6.5], context: 'External validation through publication or clients', subcategory: 'photography', fieldPrestige: 3, keyDifferentiator: 'Paid work vs personal projects' },
      ],
      4: [
        { activity: 'School art show participant', scoreRange: [4, 5], context: 'Showing work at school-level exhibition', subcategory: 'fine_art', fieldPrestige: 4, keyDifferentiator: 'School show vs external exhibition' },
        { activity: 'Art class with strong portfolio', scoreRange: [4, 4.5], context: 'Active art student without competition/exhibition', subcategory: 'fine_art', fieldPrestige: 5, keyDifferentiator: 'Dedicated practice vs class requirement' },
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
      2: [
        { activity: 'Organized community campaign reaching 500+ people', scoreRange: [7, 8.5], context: 'Significant community mobilization', subcategory: 'community_organizing', fieldPrestige: 2, keyDifferentiator: '500+ reached vs school-only' },
        { activity: 'Voter registration drive (100+ voters registered)', scoreRange: [7, 8], context: 'Quantifiable civic engagement impact', subcategory: 'policy_advocacy', fieldPrestige: 2, keyDifferentiator: '100+ registered vs awareness only' },
        { activity: 'Environmental initiative with measurable impact', scoreRange: [7, 8], context: 'Quantified environmental outcomes (tons recycled, trees planted)', subcategory: 'environmental', fieldPrestige: 2, keyDifferentiator: 'Measurable impact vs awareness campaign' },
      ],
      3: [
        { activity: 'School environmental club leader with initiatives', scoreRange: [5.5, 6.5], context: 'School-level environmental action', subcategory: 'environmental', fieldPrestige: 3, keyDifferentiator: 'Active initiatives vs meeting-only club' },
        { activity: 'Social justice awareness campaign (school-wide)', scoreRange: [5.5, 6.5], context: 'Organized school-wide education/awareness', subcategory: 'social_justice', fieldPrestige: 3, keyDifferentiator: 'Organized campaign vs personal posts' },
      ],
      4: [
        { activity: 'Environmental club member', scoreRange: [4, 5], context: 'Participation without leadership or measurable impact', subcategory: 'environmental', fieldPrestige: 4, keyDifferentiator: 'Club member vs club leader vs campaign organizer' },
      ],
      5: [
        { activity: 'Attended rallies or signed petitions', scoreRange: [2.5, 3.5], context: 'Passive participation in others\' campaigns', subcategory: 'community_organizing', fieldPrestige: 5, keyDifferentiator: 'Attending vs organizing' },
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
      2: [
        { activity: 'Primary family caregiver (20+ hrs/week) while maintaining grades', scoreRange: [7, 8.5], context: 'Extraordinary maturity and sacrifice', subcategory: 'caregiving', fieldPrestige: 1, keyDifferentiator: '20+ hrs/week vs occasional help' },
        { activity: 'Promoted to management at part-time job', scoreRange: [7, 8], context: 'Demonstrated leadership in professional setting', subcategory: 'employment', fieldPrestige: 2, keyDifferentiator: 'Promoted to manager vs regular employee' },
        { activity: 'Selective professional internship (competitive application)', scoreRange: [7, 8.5], context: 'Selected through competitive process', subcategory: 'internship', fieldPrestige: 1, keyDifferentiator: 'Competitive application vs family connection' },
      ],
      3: [
        { activity: 'Part-time job (15+ hrs/week, 2+ years)', scoreRange: [5.5, 6.5], context: 'Sustained employment shows responsibility', subcategory: 'employment', fieldPrestige: 3, keyDifferentiator: '15+ hrs/week for 2+ years vs seasonal' },
        { activity: 'Regular family caregiving (10-20 hrs/week)', scoreRange: [5.5, 6.5], context: 'Significant family responsibility', subcategory: 'caregiving', fieldPrestige: 3, keyDifferentiator: 'Regular schedule vs occasional help' },
        { activity: 'Family business significant responsibility', scoreRange: [5.5, 6.5], context: 'Managing operations, not just helping', subcategory: 'family_business', fieldPrestige: 3, keyDifferentiator: 'Operational responsibility vs helping out' },
      ],
      4: [
        { activity: 'Part-time job (seasonal or <10 hrs/week)', scoreRange: [4, 5], context: 'Employment experience without significant hours', subcategory: 'employment', fieldPrestige: 4, keyDifferentiator: 'Seasonal vs year-round work' },
        { activity: 'Helping with family chores/errands', scoreRange: [4, 4.5], context: 'Expected household participation', subcategory: 'caregiving', fieldPrestige: 5, keyDifferentiator: 'Regular chores vs caregiving responsibility' },
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
      2: [
        { activity: 'Founded interfaith dialogue program (multiple communities)', scoreRange: [7, 8.5], context: 'Bridge-building across religious/cultural divides', subcategory: 'interfaith', fieldPrestige: 1, keyDifferentiator: 'Multi-community program vs single-community event' },
        { activity: 'Led service mission with 50+ participants', scoreRange: [7, 8], context: 'Organized and led significant service initiative', subcategory: 'faith_community', fieldPrestige: 2, keyDifferentiator: 'Led 50+ participants vs attended mission' },
      ],
      3: [
        { activity: 'Youth group leader teaching 20+ students', scoreRange: [5.5, 6.5], context: 'Teaching/mentoring role within community', subcategory: 'faith_community', fieldPrestige: 3, keyDifferentiator: 'Teaching role vs participant' },
        { activity: 'Cultural heritage preservation project', scoreRange: [5.5, 6.5], context: 'Active preservation of cultural traditions', subcategory: 'cultural_preservation', fieldPrestige: 3, keyDifferentiator: 'Active project vs attendance at cultural events' },
      ],
      4: [
        { activity: 'Regular youth group member', scoreRange: [4, 5], context: 'Consistent participation without leadership', subcategory: 'faith_community', fieldPrestige: 4, keyDifferentiator: 'Regular attendance vs occasional' },
      ],
      5: [
        { activity: 'Passive attendance at religious/cultural events', scoreRange: [2.5, 3.5], context: 'Attendance without active engagement', subcategory: 'faith_community', fieldPrestige: 5, keyDifferentiator: 'Attendance vs participation vs leadership' },
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
        { activity: 'RSI / SSP / TASP alumnus', scoreRange: [9, 10], context: 'Most selective HS programs in the world', selectivityRatio: 'RSI: 80/3000 (2.7%), SSP: 100/1500 (6.7%)', subcategory: 'summer_programs', fieldPrestige: 1, keyDifferentiator: 'RSI/SSP tier vs other selective programs' },
      ],
      2: [
        { activity: 'Ross Mathematics / PROMYS / HCSSiM', scoreRange: [7, 8.5], context: 'Highly selective math programs (10-15% acceptance)', selectivityRatio: '~50-60 per program', subcategory: 'summer_programs', fieldPrestige: 1, keyDifferentiator: 'Selective math camp vs general enrichment' },
        { activity: 'University course with A grade (advanced subject)', scoreRange: [7, 8], context: 'Excelling in college-level coursework', subcategory: 'dual_enrollment', fieldPrestige: 2, keyDifferentiator: 'Advanced subject + A grade vs introductory course' },
      ],
      3: [
        { activity: 'Dual enrollment (3+ courses, strong grades)', scoreRange: [5.5, 6.5], context: 'Regular college coursework while in high school', subcategory: 'dual_enrollment', fieldPrestige: 3, keyDifferentiator: '3+ courses vs single course' },
        { activity: 'Non-selective but rigorous summer program', scoreRange: [5.5, 6], context: 'Paid programs with academic content', subcategory: 'summer_programs', fieldPrestige: 3, keyDifferentiator: 'Rigorous content vs enrichment tourism' },
      ],
      4: [
        { activity: 'Single dual enrollment course', scoreRange: [4, 5], context: 'One college course; increasingly common', subcategory: 'dual_enrollment', fieldPrestige: 4, keyDifferentiator: 'Single course vs multi-course track' },
        { activity: 'Online course completion (Coursera, edX)', scoreRange: [4, 4.5], context: 'Shows initiative but very accessible', subcategory: 'independent_study', fieldPrestige: 5, keyDifferentiator: 'Completed with certificate vs started only' },
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
      ],
      2: [
        { activity: 'NSLI-Y or competitive exchange program', scoreRange: [7, 8.5], context: 'Government-sponsored, highly selective language program', selectivityRatio: 'NSLI-Y: ~600 of 5,000+ (12%)', subcategory: 'exchange_programs', fieldPrestige: 1, keyDifferentiator: 'Competitive program vs pay-to-go trip' },
        { activity: 'Founded cross-cultural initiative with sustained impact', scoreRange: [7, 8.5], context: 'Created lasting bridge between communities', subcategory: 'global_service', fieldPrestige: 2, keyDifferentiator: 'Founded initiative vs participated in trip' },
      ],
      3: [
        { activity: 'Year-long exchange program (AFS, Rotary)', scoreRange: [5.5, 6.5], context: 'Full year abroad shows significant commitment', subcategory: 'exchange_programs', fieldPrestige: 3, keyDifferentiator: 'Year-long vs summer vs week-long' },
      ],
      4: [
        { activity: 'Short-term service trip abroad (1-2 weeks)', scoreRange: [4, 5], context: 'Limited duration; impact often minimal', subcategory: 'global_service', fieldPrestige: 4, keyDifferentiator: 'Short-term trip vs sustained engagement' },
      ],
      5: [
        { activity: 'Family vacation with cultural exposure', scoreRange: [2.5, 3], context: 'Travel without structured learning or service', subcategory: 'exchange_programs', fieldPrestige: 5, keyDifferentiator: 'Tourism vs structured program' },
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
      2: [
        { activity: 'YouTube channel with 10,000+ subscribers (educational/mission-driven)', scoreRange: [7, 8.5], context: 'Large audience with purposeful content', subcategory: 'youtube', fieldPrestige: 2, keyDifferentiator: '10K+ subscribers vs 1K vs 100' },
        { activity: 'Podcast with 50+ episodes and measurable community impact', scoreRange: [7, 8], context: 'Sustained content creation with real audience', subcategory: 'podcasting', fieldPrestige: 2, keyDifferentiator: '50+ episodes vs 5 episodes; mission-driven vs entertainment' },
      ],
      3: [
        { activity: 'YouTube/podcast with 1,000+ regular viewers and consistent schedule', scoreRange: [5.5, 6.5], context: 'Growing platform with engaged audience', subcategory: 'youtube', fieldPrestige: 3, keyDifferentiator: '1000+ engaged vs 100 casual followers' },
        { activity: 'Educational content series with documented learning outcomes', scoreRange: [5.5, 6.5], context: 'Content with measurable educational impact', subcategory: 'content_creation', fieldPrestige: 3, keyDifferentiator: 'Educational impact vs entertainment views' },
      ],
      4: [
        { activity: 'Personal blog/channel with small audience', scoreRange: [4, 5], context: 'Shows initiative but limited reach', subcategory: 'content_creation', fieldPrestige: 4, keyDifferentiator: 'Regular posting vs occasional content' },
      ],
      5: [
        { activity: 'Casual social media posting', scoreRange: [2.5, 3], context: 'Personal use without content creation intent', subcategory: 'content_creation', fieldPrestige: 5, keyDifferentiator: 'Personal posts vs purposeful content' },
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
