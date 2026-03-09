/**
 * STEM Competitions — Impressiveness Calibration Domain
 *
 * Covers: math olympiads (AMC/AIME/USAMO/IMO), science olympiads,
 * physics/chemistry/biology/informatics olympiads, USACO, ISEF,
 * Regeneron STS, and other competitive STEM events.
 *
 * Key insight for AOs: Competition results are the most OBJECTIVE
 * metric AOs have. Unlike research (which can be inflated by a
 * generous PI), competition results have clear national/international
 * benchmarks. AOs at T10 schools know exactly what "AIME qualifier"
 * or "USAMO" means — these are hard currency in STEM admissions.
 */

import type { ImpressivenessDomain } from '../types';

export const STEM_COMPETITIONS_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'stem_competition',
  label: 'STEM Competitions',
  overview:
    'STEM competitions provide the most objectively verifiable measure of intellectual talent in an application. AOs at selective schools — especially MIT, Caltech, and the Ivies — have precise mental models for what each qualification level means. AIME qualification is the de facto "you\'re serious about math" threshold. USAMO/USACO Platinum signals top ~250-500 students nationally. IMO/IOI team selection is unambiguous evidence of world-class ability. Unlike subjective activities, competition results cannot be inflated — you either qualified or you didn\'t.',

  ladder: [
    // ── BASELINE ──────────────────────────────────────────────────────────
    {
      level: 'baseline',
      description:
        'Participation in school math team or science bowl without advancing beyond school level. AMC 10/12 participation without AIME qualification. Local/invitational tournament attendance. Science Olympiad member without individual medals.',
      whyImpressive:
        'AOs see this as interest confirmation, nothing more. Participating in AMC without qualifying for AIME tells an AO that the student likes math but hasn\'t yet distinguished themselves. Thousands of students take AMC — the test itself is the baseline. School math team membership is so common among STEM applicants that it carries near-zero signal at selective schools.',
      prevalence:
        'Extremely common. ~60-70% of STEM applicants at selective schools list some form of math/science competition participation.',
      applicantPercentile: 'Top 60-70%',
      verificationMarkers: [
        'Lists "Math Team" or "Science Bowl" without specific results',
        'AMC score below AIME cutoff (typically <100 on AMC 10, <85 on AMC 12)',
        'Mentions participation but not placement',
        'No specific competition names beyond school-level events',
      ],
      differentiatorFromBelow:
        'At least engaged with competitive problem-solving rather than just classroom math.',
      differentiatorFromAbove:
        'No external validation of ability. Participation alone tells AOs nothing about actual mathematical/scientific skill level. The question is always: "How did you do?"',
      tierRange: [5, 6],
    },

    // ── NOTABLE ───────────────────────────────────────────────────────────
    {
      level: 'notable',
      description:
        'AIME qualifier (~top 2.5-5% of AMC takers). USACO Silver division. Regional Science Olympiad medalist. MATHCOUNTS state qualifier. Physics/Chemistry Olympiad semifinalist (USAPhO/USNCO). Placing at a recognized invitational tournament.',
      whyImpressive:
        'This is where AOs start to take notice. AIME qualification is a bright-line signal — it means the student is in the top 2.5-5% of an already self-selected population of strong math students. USACO Silver means the student can solve non-trivial algorithmic problems under time pressure. Regional Science Olympiad medals show mastery of a specific scientific domain against serious competitors. These achievements won\'t carry an application alone, but they meaningfully strengthen a STEM narrative.',
      prevalence:
        'Moderately common among T20 applicants. ~15-25% of STEM-focused applicants to selective schools have at least one of these qualifications.',
      applicantPercentile: 'Top 15-25%',
      verificationMarkers: [
        'Specific AIME score mentioned (typically 3-7 range)',
        'USACO division clearly stated with contest season',
        'Science Olympiad event name and placement specified',
        'MATHCOUNTS state placement or score',
        'Can describe specific problems solved or strategies used',
      ],
      differentiatorFromBelow:
        'Objective qualification threshold crossed. AIME, USACO Silver, or regional medals are verifiable achievements that demonstrate proven ability, not just participation.',
      differentiatorFromAbove:
        'These achievements are common enough at T20 schools that they don\'t differentiate on their own. AIME qualification is nearly expected at MIT/Caltech. The student has proven competence but not yet demonstrated elite-level performance.',
      tierRange: [4],
    },

    // ── IMPRESSIVE ────────────────────────────────────────────────────────
    {
      level: 'impressive',
      description:
        'USACO Gold division. State Science Olympiad medalist or state team member. AIME score of 8+ (Honor Roll range). ISEF regional/affiliated fair finalist. USAPhO/USNCO qualifier for national exam. MATHCOUNTS national qualifier. PUMaC/HMMT individual top-50 finishes.',
      whyImpressive:
        'AOs at T10 schools see these students as genuinely talented, not just hardworking. USACO Gold requires solving problems that many college CS students struggle with. State-level Science Olympiad champions have demonstrated deep mastery in their events. An AIME 8+ places the student among the top ~1,000 math students nationally. ISEF regional finalists survived a competitive selection process that verifies project quality. These achievements actively boost an application — AOs flag these students as "strong STEM" in their notes.',
      prevalence:
        'Uncommon. ~5-8% of applicants to T10 schools. Roughly 2,000-5,000 students nationally per year achieve this level across all STEM competition categories.',
      applicantPercentile: 'Top 5-8%',
      verificationMarkers: [
        'USACO Gold with specific contest and score',
        'State Science Olympiad medal with event and placement',
        'AIME score of 8 or higher clearly stated',
        'ISEF affiliated fair name and project category',
        'USAPhO/USNCO exam score or qualification confirmation',
        'Specific invitational placement with event context',
      ],
      differentiatorFromBelow:
        'Performance is now elite-regional or nationally competitive. The student isn\'t just qualifying — they\'re excelling. These results require hundreds of hours of dedicated preparation and genuine mathematical/scientific talent.',
      differentiatorFromAbove:
        'Still competing at the national qualifying level rather than the national/international final level. The student is a strong competitor but hasn\'t yet reached the pinnacle events (USAMO, USACO Platinum, ISEF Grand Awards, Olympiad teams).',
      tierRange: [3],
    },

    // ── EXCEPTIONAL ───────────────────────────────────────────────────────
    {
      level: 'exceptional',
      description:
        'USAMO qualifier (top ~250 nationally). USACO Platinum division. ISEF finalist (top ~1,800 from millions worldwide). Regeneron STS semifinalist (top 300). National Science Olympiad medalist. MOP (Math Olympiad Program) invitee. HMMT/PUMaC team or individual winner.',
      whyImpressive:
        'AOs read these credentials and immediately flag the student for priority consideration. USAMO qualification means the student is among the 250 best math students in the country — period. USACO Platinum means algorithmic ability that exceeds most CS undergraduates. ISEF finalists were selected from 7+ million participants worldwide. These aren\'t just "strong" students — these are students who have proven themselves against the most talented peers in the nation. At T5 schools, these achievements generate "we need to admit this student" conversations in committee.',
      prevalence:
        'Rare. ~1-2% of applicants even to T5 schools. ~250-500 students nationally per competition category per year.',
      applicantPercentile: 'Top 1-2%',
      verificationMarkers: [
        'USAMO with specific year and score',
        'USACO Platinum with contest performance details',
        'ISEF finalist with project number, category, and year',
        'STS semifinalist confirmation',
        'MOP invitation letter or attendance year',
        'National Science Olympiad event placement',
        'Results verifiable through official competition websites',
      ],
      differentiatorFromBelow:
        'National-level selection. These students didn\'t just compete nationally — they were selected as among the very best in the country. The competitions themselves serve as rigorous, multi-round filters that verify exceptional ability.',
      differentiatorFromAbove:
        'Has reached the national elite level but not yet the international pinnacle. USAMO qualifier vs. IMO team member. ISEF finalist vs. Grand Award winner. The difference is between "among the best in the country" and "among the best in the world."',
      tierRange: [2],
    },

    // ── EXTRAORDINARY ─────────────────────────────────────────────────────
    {
      level: 'extraordinary',
      description:
        'IMO/IOI/IPhO/IChO/IBO team member. ISEF Grand Award winner (Best of Category, 1st-4th place). Regeneron STS finalist (top 40). Putnam Fellow or high Putnam scorer (college-level, exceptional if achieved in HS). Multiple Olympiad qualifications across fields.',
      whyImpressive:
        'AOs encounter these students once every few years — sometimes less. IMO team selection means the student is one of 6 chosen to represent the entire country against the world. ISEF Grand Award means the student\'s research was judged the best in its category out of millions of initial participants. STS finalists (top 40 from ~2,000 applicants, each already exceptional) have survived the most prestigious science talent search in the US. These achievements are so rare that they often come with media coverage. Admissions officers don\'t evaluate these students — they recruit them. Every T5 school wants these applicants, and the conversation in committee is about landing them, not whether to admit them.',
      prevalence:
        'Extraordinarily rare. <0.01% of all applicants. ~30-50 students per competition per year nationally. Perhaps 100-200 students total across all STEM competition categories at this level.',
      applicantPercentile: 'Top 0.01%',
      verificationMarkers: [
        'International Olympiad team selection with country and year',
        'IMO/IOI/IPhO medal color (Gold/Silver/Bronze)',
        'ISEF Grand Award category and placement',
        'STS finalist project title and ranking',
        'Verifiable through official delegation lists and competition records',
        'Often accompanied by media coverage or institutional announcements',
        'Multiple years of progressive competition achievement',
      ],
      differentiatorFromBelow:
        'International selection or pinnacle national awards. These students didn\'t just reach the top nationally — they were chosen to represent their country or won the most prestigious awards in their field. The difference between "top 250" and "top 6" is immense.',
      differentiatorFromAbove:
        'This is the absolute ceiling for HS STEM competitions. These achievements place students among the most talented young scientists and mathematicians in the world. There is no higher level to reach.',
      tierRange: [1],
    },
  ],

  technicalDepthMarkers: [
    {
      term: 'AIME score',
      meaning:
        'Score on the American Invitational Mathematics Examination, the second stage of the AMC series. Scored 0-15, with scores of 10+ being exceptional.',
      hsContext:
        'AIME scores are precise signals. A score of 3-5 is respectable. 6-8 is strong. 9-11 indicates potential USAMO qualifier. 12+ is extraordinary (top ~50-100 students nationally). AOs at math-heavy schools like MIT decode these instantly.',
      indicatesLevel: 'notable',
      detectionKeywords: ['AIME', 'AIME score', 'AMC qualifier', 'invitational mathematics'],
      detectionConfidence: 'high',
    },
    {
      term: 'USACO division',
      meaning:
        'USA Computing Olympiad competitive programming divisions: Bronze → Silver → Gold → Platinum. Each promotion requires passing a contest with non-trivial algorithmic problems.',
      hsContext:
        'Bronze is baseline (many CS students reach it quickly). Silver shows solid algorithmic thinking. Gold requires advanced algorithms (graphs, DP, binary search on answer). Platinum requires near-competition-level mastery of advanced data structures and algorithms.',
      indicatesLevel: 'notable',
      detectionKeywords: ['USACO', 'Bronze', 'Silver', 'Gold', 'Platinum', 'computing olympiad'],
      detectionConfidence: 'high',
    },
    {
      term: 'proof-based competition',
      meaning:
        'Competitions requiring written mathematical proofs rather than multiple choice or numerical answers. USAMO, PUTNAM, and Olympiad-level events.',
      hsContext:
        'Proof-writing is a fundamentally different skill from computational math. Students who compete in proof-based events demonstrate mathematical maturity far beyond the standard curriculum. This is the dividing line between "good at math tests" and "genuinely mathematical thinker."',
      indicatesLevel: 'impressive',
      detectionKeywords: ['proof', 'proof-based', 'USAMO', 'olympiad proof', 'written proof', 'mathematical proof'],
      detectionConfidence: 'medium',
    },
    {
      term: 'algorithmic complexity',
      meaning:
        'Understanding of Big-O notation, time/space tradeoffs, and algorithm design. Central to competitive programming.',
      hsContext:
        'Mentioning specific complexity analysis (e.g., "O(n log n) solution" or "reduced from O(n^3) to O(n^2)") signals genuine CS depth beyond copying solutions. It indicates the student understands WHY their solution works efficiently, not just THAT it passes tests.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['O(n)', 'time complexity', 'space complexity', 'Big-O', 'algorithmic', 'optimization'],
      detectionConfidence: 'medium',
    },
    {
      term: 'team vs. individual event',
      meaning:
        'Distinction between competitions where students compete individually (AMC, USACO) vs. as part of a team (Science Olympiad events, team rounds).',
      hsContext:
        'Individual results are stronger signals of personal ability. Team events show collaboration but make it harder to assess individual contribution. AOs weight individual achievements more heavily for gauging talent, while team achievements add evidence of collaboration skills.',
      indicatesLevel: 'baseline',
      detectionKeywords: ['team event', 'individual event', 'team round', 'individual round', 'relay', 'team competition'],
      detectionConfidence: 'low',
    },
    {
      term: 'selection ratio',
      meaning:
        'The percentage of applicants/participants who advance to the next level. Lower ratios indicate more competitive selection.',
      hsContext:
        'AOs internally translate competition achievements into selectivity. AMC→AIME is ~5%. AIME→USAMO is ~1.5% of AIME takers. MOP is ~60 from USAMO. IMO team is 6 from MOP. Each step is a dramatic filter. Students who describe the selection funnel demonstrate self-awareness about their achievement level.',
      indicatesLevel: 'notable',
      detectionKeywords: ['selection rate', 'acceptance rate', 'qualified out of', 'top percent', 'advanced from'],
      detectionConfidence: 'low',
    },
    {
      term: 'national cutoff',
      meaning:
        'The score threshold required to advance to national-level competition rounds or qualify for national recognition.',
      hsContext:
        'Specific cutoff knowledge (e.g., "scored 9 on AIME, needed 10 for USAMO that year") shows the student understands exactly where they stand in the national landscape. It signals competitive seriousness and self-awareness.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['cutoff', 'qualifying score', 'threshold', 'needed X to qualify', 'floor score'],
      detectionConfidence: 'low',
    },
    {
      term: 'camp invitee (MOP/training camp)',
      meaning:
        'Invitation to a national training camp (e.g., MOP for math, USACO camp for CS). These camps select the top ~30-60 students nationally for intensive training, often as a pipeline to international teams.',
      hsContext:
        'Camp invitations are exceptional achievements. MOP has ~60 invitees from the entire country. These camps serve as the selection pool for international Olympiad teams. Being invited means the student is in the top ~60 in the entire nation in their field.',
      indicatesLevel: 'exceptional',
      detectionKeywords: ['MOP', 'Math Olympiad Program', 'training camp', 'camp invitee', 'national camp', 'USACO camp'],
      detectionConfidence: 'high',
    },
    {
      term: 'qualifying score progression',
      meaning:
        'Multi-year improvement trajectory through competition levels (e.g., AMC → AIME → USAMO, or USACO Bronze → Silver → Gold → Platinum).',
      hsContext:
        'Showing progression over 2-3 years tells a growth story that AOs value. A student who went from AMC 80 to AIME 7 to USAMO qualifier demonstrates dedication, self-improvement, and competitive drive — not just raw talent.',
      indicatesLevel: 'notable',
      detectionKeywords: ['improved from', 'progressed to', 'advanced from', 'promoted to', 'moved up to'],
      detectionConfidence: 'low',
    },
    {
      term: 'round advancement',
      meaning:
        'Advancing through progressive elimination rounds in a multi-stage competition. Each round filters a significant portion of competitors.',
      hsContext:
        'The specific round reached is the critical data point. "Advanced to semifinals" is meaningless without knowing the competition. "Advanced to Round 3 of HMMT November" carries precise meaning for those who know these competitions. Context is everything.',
      indicatesLevel: 'notable',
      detectionKeywords: ['advanced to', 'round 2', 'round 3', 'semifinals', 'finals', 'next round', 'elimination round'],
      detectionConfidence: 'low',
    },
  ],
};
