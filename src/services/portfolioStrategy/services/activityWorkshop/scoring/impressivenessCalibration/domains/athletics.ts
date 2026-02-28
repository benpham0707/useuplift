/**
 * Athletics — Impressiveness Calibration
 *
 * Covers: All varsity/club sports, individual and team, including
 * track & field, swimming, soccer, basketball, tennis, rowing, etc.
 *
 * Key insight for AOs: Athletics is heavily resume-padded. "Varsity
 * captain" appears on a huge fraction of apps. The real differentiators
 * are recruiting classifications (D1 recruit vs. D3 walk-on), measurable
 * performance metrics (times, rankings), and external selection
 * (All-Conference, All-State, All-American).
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const ladder: ImpressionEntry[] = [
  {
    level: 'baseline',
    description:
      'JV team member or recreational club sport participant. May participate in school intramurals or community leagues. Consistent attendance and effort but no competitive distinction.',
    whyImpressive:
      'Not a differentiator at selective schools. AOs see JV participation as standard engagement — it shows the student is active but doesn\'t signal athletic excellence. At highly selective schools, this is essentially a filler activity unless framed uniquely (e.g., started the sport senior year and made varsity).',
    prevalence: 'Extremely common — the majority of applicants list some athletic involvement.',
    applicantPercentile: 'Top 70-90%',
    verificationMarkers: [
      'Named specific sport and team level (JV, club, recreational)',
      'Mentioned seasons played or years of participation',
      'Described training commitment (practices per week)',
    ],
    differentiatorFromBelow: 'At least committed to a team with regular practice and competition schedule.',
    differentiatorFromAbove: 'No varsity-level competition, no individual statistical achievements, no external selection.',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description:
      'Varsity starter or significant contributor. Team captain or co-captain. Multiple varsity letters. Strong individual statistics or personal records. May compete in club/travel team at regional level. Team reached playoffs or conference championship.',
    whyImpressive:
      'AOs see varsity starter and captain frequently, but it still signals genuine commitment and peer-recognized leadership. The distinction from baseline is that this student earned a position of responsibility and contributed meaningfully to team success. However, at selective schools, varsity captain alone doesn\'t move the needle — it needs to be combined with performance metrics or post-season success.',
    prevalence: 'Common among athletic applicants — roughly 1 in 5 varsity athletes become captains.',
    applicantPercentile: 'Top 25-45%',
    verificationMarkers: [
      'Varsity starter status with sport and years',
      'Captain or co-captain designation',
      'Specific statistics (goals, assists, times, distances, batting average)',
      'Team post-season results (playoff appearance, conference championship)',
      'Varsity letter count',
      'Club/travel team with league or organization name',
    ],
    differentiatorFromBelow: 'Varsity-level competition with starting role or leadership. Measurable contribution to team.',
    differentiatorFromAbove: 'No external selection beyond the team (All-Conference, All-Region). Strong within school but not recognized externally.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description:
      'All-Conference or All-League selection. State qualifier in individual sports. Club/travel team competes at national qualifiers. Top performer in conference with verifiable stats. Multi-sport All-Conference athlete. D3 or strong D2 recruiting interest.',
    whyImpressive:
      'All-Conference means coaches across multiple schools recognized this student as one of the best in the league — it\'s external validation from people who competed against them. State qualification in individual sports (track times, swim cuts, wrestling weight class) provides objective, measurable benchmarks. AOs see this as genuine athletic distinction that most student-athletes never achieve.',
    prevalence: 'Uncommon — All-Conference typically selects 10-15 athletes per sport per conference.',
    applicantPercentile: 'Top 10-20%',
    verificationMarkers: [
      'All-Conference or All-League team with conference name and year',
      'State qualifying time/mark/result with event and state',
      'Verifiable statistics with conference ranking',
      'Club/travel team national qualifier with organization name',
      'Recruiting correspondence from D2/D3 coaches',
      'Named tournament or invitational results',
    ],
    differentiatorFromBelow: 'External recognition beyond own team. Validated by opposing coaches or objective qualifying standards.',
    differentiatorFromAbove: 'Conference-level recognition but not state-level dominance. Qualifier but not placer at state.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description:
      'All-State selection. State champion or medalist. D1 recruited athlete (verbal commit, official visits). National-level club/travel team competitor. All-American honorable mention. Top-100 national ranking in individual sport. School or state records.',
    whyImpressive:
      'All-State and D1 recruitment are the watershed markers in HS athletics. An All-State selection means this student is among the very best in an entire state — selected by a statewide panel of coaches and media. D1 recruiting interest means college coaches with professional scouting operations have identified this student as scholarship-worthy. AOs at elite schools recognize that D1 recruitment represents a level of athletic achievement that required years of intensive training, competition, and physical development. This is a significant application differentiator.',
    prevalence: 'Rare — All-State typically selects 20-50 athletes per sport per state. Fewer than 7% of HS athletes compete in college at any level; D1 is under 2%.',
    applicantPercentile: 'Top 2-5%',
    verificationMarkers: [
      'All-State team with state, sport, and year',
      'State championship placement with event and results',
      'D1 verbal commit or NLI signed with school name',
      'Official visit documentation (5 visit maximum)',
      'National ranking with ranking service name',
      'School or state record with specific mark/time',
      'All-American mention with organization (MaxPreps, USA Today, etc.)',
    ],
    differentiatorFromBelow: 'State-wide or national recognition. D1 recruiting validation. Results that place student in the top fraction of all athletes.',
    differentiatorFromAbove: 'All-State but not All-American. D1 recruit but not blue-chip prospect. State champion but not national contender.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description:
      'National champion (individual or key contributor). All-American (1st team). Olympic development program or national team member. Professional contract or draft prospect. Multiple national records or rankings. Blue-chip D1 recruit (top-50 national recruit).',
    whyImpressive:
      'This student is one of the best athletes in the country in their sport. National championship, All-American, or Olympic development status places them in a category where athletics IS their primary identity — not an extracurricular. AOs at athletic powerhouse schools (Stanford, Duke, UNC, Michigan) have coaches specifically advocating for these students in admissions. At academic schools, this level of athletic achievement can compensate for otherwise borderline academic profiles. This is the rarest form of HS achievement.',
    prevalence: 'Extremely rare — All-American 1st team selects ~25 athletes per sport nationally per year.',
    applicantPercentile: 'Top 0.1%',
    verificationMarkers: [
      'National championship with event, year, and organization',
      'All-American 1st team with selecting organization',
      'Olympic development or national team membership',
      'Professional contract or draft evaluation',
      'Top-50 national recruiting ranking with service (247Sports, Rivals, ESPN)',
      'National records with verification',
      'Blue-chip prospect status with recruiting rankings',
    ],
    differentiatorFromBelow: 'National-level dominance and professional trajectory vs. state-level excellence.',
    differentiatorFromAbove: 'This is the ceiling for HS athletics.',
    tierRange: [1],
  },
];

const technicalDepthMarkers: TechnicalDepthMarker[] = [
  {
    term: 'Recruiting classification (D1/D2/D3)',
    meaning:
      'NCAA division levels indicate the competitive tier of college athletics. D1 is the highest (full athletic scholarships available), D2 offers partial scholarships, D3 has no athletic scholarships but competitive programs.',
    hsContext:
      'D1 recruiting interest is the clearest external validation of athletic excellence. A verbal commit or NLI (National Letter of Intent) to a D1 program confirms that professional scouts have evaluated this student. D3 recruitment, while less selective athletically, can signal strong athlete-scholar balance.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['d1', 'd2', 'd3', 'division 1', 'division 2', 'division 3', 'ncaa', 'recruited', 'recruit', 'scholarship offer'],
    detectionConfidence: 'high',
  },
  {
    term: 'Varsity letters',
    meaning:
      'A varsity letter is awarded to athletes who meet minimum playing time or performance standards on a varsity team. Multiple letters (3-4 year letterman) show sustained varsity-level contribution.',
    hsContext:
      'A 4-year letterman shows sustained commitment and improving skill over the full HS career. By itself, it\'s common, but combined with other markers (captain, All-Conference) it shows growth trajectory.',
    indicatesLevel: 'notable',
    detectionKeywords: ['varsity letter', 'letterman', 'lettered', '4-year varsity', '3-year varsity', 'earned letter'],
    detectionConfidence: 'medium',
  },
  {
    term: 'All-Conference vs. All-State',
    meaning:
      'All-Conference: selected as one of the best players in a local athletic conference (typically 8-16 schools). All-State: selected as one of the best in the entire state (hundreds of schools). All-State is roughly 10x more selective.',
    hsContext:
      'All-Conference is the entry point for external athletic recognition. All-State is the watershed that separates strong athletes from elite ones. The gap between them is enormous — All-Conference might be top 10% of the conference, while All-State is top 0.5% of the state.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['all-conference', 'all conference', 'all-league', 'all league', 'all-state', 'all state', 'all-region', 'all region'],
    detectionConfidence: 'high',
  },
  {
    term: 'State qualifying time/score',
    meaning:
      'In individual sports (track, swimming, wrestling, tennis), athletes must achieve a specific performance standard (time, score, or match record) to qualify for the state championship. These standards are publicly posted and objectively verifiable.',
    hsContext:
      'State qualifying standards are objective — you either hit the time or you don\'t. This makes them one of the most reliable indicators of athletic level. A state qualifying time in swimming or track is unambiguous evidence of top-tier performance.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['state qualifying', 'state cut', 'qualifying time', 'qualifying standard', 'state meet', 'state championship'],
    detectionConfidence: 'high',
  },
  {
    term: 'National ranking',
    meaning:
      'Individual or team ranking at the national level by a recognized ranking service (MileSplit for track/XC, SwimCloud for swimming, TennisRecruiting for tennis, PrepVolleyball, etc.).',
    hsContext:
      'A top-100 or top-50 national ranking places the student among the absolute best in the country. Ranking services aggregate results from across all states, providing objective cross-state comparison.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['nationally ranked', 'national ranking', 'ranked nationally', 'top 100', 'top 50', 'milesplit', 'swimcloud'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Recruiting visits / verbal commit / NLI',
    meaning:
      'Official visit: paid campus visit by a college program (D1 limited to 5). Verbal commit: non-binding agreement to attend. NLI (National Letter of Intent): binding agreement to attend and receive scholarship.',
    hsContext:
      'Official visits mean a college program is investing its limited visit allocation in this student. A verbal commit, especially to a P5 conference school, confirms D1-level talent. NLI signing is the definitive marker of recruited athlete status.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['official visit', 'verbal commit', 'committed to', 'nli', 'national letter of intent', 'signed with', 'signing day'],
    detectionConfidence: 'high',
  },
  {
    term: 'Travel/club vs. school sport',
    meaning:
      'Club/travel teams operate outside the school system, often with paid coaching, regional/national travel, and year-round training. They represent a higher investment and typically stronger competition than school teams.',
    hsContext:
      'In many sports (soccer, volleyball, baseball, basketball), the club/travel circuit is where serious recruiting happens. A student on an ECNL soccer team or a travel baseball team competing at PG/WWBA events is in a fundamentally different competitive environment than school-only athletes.',
    indicatesLevel: 'notable',
    detectionKeywords: ['club team', 'travel team', 'aau', 'ecnl', 'travel ball', 'club season', 'select team', 'elite club'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Performance statistics / personal records',
    meaning:
      'Specific, measurable athletic performance data: times (track, swimming), distances (field events), scoring averages, win-loss records, or personal records (PRs).',
    hsContext:
      'Concrete stats are the strongest antidote to resume padding. "Led the team" means nothing; "scored 23 goals in 18 games" is verifiable and contextualizable. AOs and coaches can immediately gauge the level from specific numbers.',
    indicatesLevel: 'notable',
    detectionKeywords: ['personal record', 'personal best', 'pr of', 'pb of', 'scored', 'batting average', 'era', 'goals', 'assists', 'time of'],
    detectionConfidence: 'low',
  },
  {
    term: 'School or state record',
    meaning:
      'The best performance ever recorded at the school level or state level in a specific event. School records may stand for decades; state records represent the highest performance in state history.',
    hsContext:
      'A school record shows the student is the best to ever play that sport at their school. A state record places them in historical context — the best in state history. Both are exceptional markers but state records are in a different category entirely.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['school record', 'state record', 'broke the record', 'set the record', 'record holder', 'all-time'],
    detectionConfidence: 'high',
  },
  {
    term: 'MVP / Player of the Year',
    meaning:
      'Most Valuable Player at the team, conference, or regional/state level. Player of the Year is typically a state-wide or regional award recognizing the single best player in a sport.',
    hsContext:
      'Team MVP is common and not very distinctive. Conference or regional MVP shows external recognition. State Player of the Year is a major distinction — only one athlete per sport per state receives it.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['mvp', 'most valuable', 'player of the year', 'athlete of the year', 'poty'],
    detectionConfidence: 'medium',
  },
];

export const ATHLETICS_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'athletics',
  label: 'Athletics',
  overview:
    'Athletics is the most common extracurricular but also the most transparently tiered. AOs can instantly calibrate athletic achievement through recruiting classifications, All-Conference/All-State selections, and objective performance metrics. The key challenge is separating "varsity captain" (common) from "D1 recruit" (rare) — the gap between them is enormous but both appear in the same activities section.',
  ladder,
  technicalDepthMarkers,
};
