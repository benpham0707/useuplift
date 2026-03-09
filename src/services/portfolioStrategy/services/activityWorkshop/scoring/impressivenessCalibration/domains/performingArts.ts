/**
 * Performing Arts — Impressiveness Calibration
 *
 * Covers: Instrumental Music, Vocal Music, Theater/Musical Theater,
 * Dance, Film/Video Production, Marching Band, Orchestra, Jazz
 *
 * Key insight for AOs: Performing arts has the widest variance in
 * what "good" means. All-State is universally understood; "lead role"
 * means nothing without knowing the program's caliber. The technical
 * markers (NYSSMA Level 6, concertmaster, All-National) are the
 * unambiguous signals AOs look for.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const ladder: ImpressionEntry[] = [
  {
    level: 'baseline',
    description:
      'Member of school ensemble (band, choir, orchestra, dance company). Participates in school productions in ensemble or minor roles. Attends group lessons. May perform at school concerts or recitals.',
    whyImpressive:
      'Not a differentiator. AOs see "member of school choir" or "played in school orchestra" on thousands of applications. Without external validation or leadership within the ensemble, this is indistinguishable from standard participation. It shows interest but not demonstrated achievement.',
    prevalence: 'Extremely common — 1 in 4 applicants lists some performing arts involvement.',
    applicantPercentile: 'Top 60-80%',
    verificationMarkers: [
      'Named specific ensemble or production',
      'Described specific instrument/voice part/role',
      'Mentioned years of training or practice hours',
    ],
    differentiatorFromBelow: 'Active, consistent participation in a structured ensemble vs. casual involvement.',
    differentiatorFromAbove: 'No leadership within ensemble, no audition-based honors, no external recognition.',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description:
      'Section leader, first chair in school ensemble, or supporting/featured role in school productions. Selected for District or County honors ensemble. Consistent private study with demonstrated progress (NYSSMA Level 4-5, ABRSM Grade 5-6). Active in multiple ensembles or cross-trains in multiple disciplines.',
    whyImpressive:
      'AOs recognize that section leader or first chair means this student was selected by their director as the strongest player in their section — it\'s peer-validated leadership. District honors selection adds external validation beyond the school. This shows genuine commitment and developing skill, but is still common among strong applicants to selective schools.',
    prevalence: 'Moderately common — about 1 in 10 applicants at selective schools have district-level honors.',
    applicantPercentile: 'Top 25-40%',
    verificationMarkers: [
      'Named section leader position with ensemble context',
      'District/county honors ensemble with audition details',
      'Specific role in named production (not just "school play")',
      'NYSSMA/ABRSM/RCM exam level and score',
      'Private teacher study duration',
      'Named competition with placement',
    ],
    differentiatorFromBelow: 'External validation (district honors, audition-based placement) vs. only school-level participation.',
    differentiatorFromAbove: 'Has not reached state-level recognition. Strong within school/district but not regionally/nationally recognized.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description:
      'All-State ensemble member. Lead or principal role in competitive school/community theater program. Regional recognition in competitions. NYSSMA Level 6 or ABRSM Grade 7-8. Concertmaster or drum major. Original compositions performed publicly. Pre-college program acceptance (non-conservatory).',
    whyImpressive:
      'All-State is the universal signal in performing arts — it means this student auditioned against every musician in their state and was selected as one of the best. AOs at every selective school recognize this immediately. A lead role in a strong program signals stage presence, reliability, and the ability to carry a production. NYSSMA 6 or equivalent exam scores provide objective technical benchmarks that remove subjectivity.',
    prevalence: 'Uncommon — All-State acceptance rates are typically 5-15% of auditionees depending on state/instrument.',
    applicantPercentile: 'Top 8-15%',
    verificationMarkers: [
      'All-State ensemble with state, year, and instrument/voice part',
      'Specific lead role with production name and theater company',
      'NYSSMA Level 6 / ABRSM Grade 7-8 with score',
      'Concertmaster or principal player designation',
      'Regional competition placement with competition name',
      'Original composition with performance venue/context',
      'Pre-college program name (e.g., Juilliard Pre-College, Manhattan School Pre-College)',
    ],
    differentiatorFromBelow: 'State-level recognition and objective skill benchmarks vs. school/district-level success.',
    differentiatorFromAbove: 'State-level but not nationally recognized. Strong individual but not yet in the "pre-professional" category.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description:
      'All-National ensemble member. Accepted to major pre-professional conservatory program (Juilliard Pre-College, Interlochen, Tanglewood BUTI). National competition finalist (YoungArts, MTNA). Original composition commissioned or published. Lead in professional or semi-professional production. Featured soloist with professional orchestra or in masterclass.',
    whyImpressive:
      'All-National means this student is among the best ~100-200 musicians in the country on their instrument. Conservatory pre-college programs (Juilliard, Curtis, NEC) have single-digit acceptance rates for HS students. YoungArts finalists join a cohort that includes future professional artists. AOs see these as definitive evidence of pre-professional talent — this student isn\'t just "good at music," they\'re operating at a level most adults never reach. This is a profile-defining achievement.',
    prevalence: 'Rare — All-National selects ~600 students total across all instruments and voices annually.',
    applicantPercentile: 'Top 1-3%',
    verificationMarkers: [
      'All-National ensemble with year and instrument',
      'Named conservatory pre-college program with acceptance',
      'YoungArts or equivalent national competition with finalist/winner status',
      'Commission or publication with commissioner/publisher name',
      'Professional production credits with company name',
      'Soloist appearance with orchestra/venue name',
      'Masterclass with named artist',
    ],
    differentiatorFromBelow: 'National-level recognition and pre-professional validation. Not just best in state — best in country.',
    differentiatorFromAbove: 'Pre-professional but not yet professional. Exceptional student performer vs. emerging professional artist.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description:
      'Professional debut or contract (signed with agency, professional ensemble member). Major national/international competition winner (YoungArts Gold, Sphinx Competition, International Tchaikovsky Competition for Young Musicians). Published composer with professional recordings. Broadway/national tour credit. Signed recording artist. Featured in major venue (Carnegie Hall solo, Kennedy Center).',
    whyImpressive:
      'This student has already crossed into the professional realm while still in high school. A Carnegie Hall solo performance, a professional recording contract, or a major competition victory places them in a category that most working professional musicians never achieve. AOs understand that this represents generational-level talent combined with years of intensive training. This isn\'t an extracurricular — it\'s a career that happens to be starting during high school.',
    prevalence: 'Extremely rare — perhaps 10-20 HS students nationally per year across all performing arts.',
    applicantPercentile: 'Top 0.05%',
    verificationMarkers: [
      'Named agency or management representation',
      'Professional ensemble membership with ensemble name',
      'Major competition victory with competition name and year',
      'Published recordings with label or platform',
      'Broadway or national tour credit with show name',
      'Solo performance at named major venue',
      'Press coverage or reviews in named publications',
    ],
    differentiatorFromBelow: 'Professional career already underway vs. pre-professional preparation. Revenue/contracts vs. awards.',
    differentiatorFromAbove: 'This is the ceiling for HS performing arts.',
    tierRange: [1],
  },
];

const technicalDepthMarkers: TechnicalDepthMarker[] = [
  {
    term: 'All-State ensemble',
    meaning:
      'Selected through competitive audition to perform in a state-level honors ensemble. Each state has its own process, but all involve blind or panel auditions against the full state pool.',
    hsContext:
      'The universal benchmark in HS music. AOs at every selective school recognize this. Acceptance rates vary by state and instrument but typically 5-15% of auditionees.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['all-state', 'all state', 'state ensemble', 'state orchestra', 'state band', 'state choir'],
    detectionConfidence: 'high',
  },
  {
    term: 'All-National ensemble',
    meaning:
      'Selected to perform in the NAfME All-National Honor Ensembles. Students must first be selected for All-State, then audition again at the national level.',
    hsContext:
      'Only ~600 students selected nationally each year across all ensembles. This is definitive evidence of being among the very best HS musicians in the country.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['all-national', 'all national', 'national ensemble', 'nafme', 'national honor ensemble'],
    detectionConfidence: 'high',
  },
  {
    term: 'NYSSMA / state adjudication scores',
    meaning:
      'New York State School Music Association (or equivalent state assessment) provides standardized solo performance evaluations scored by expert adjudicators. Levels 1-6, with Level 6 being the most advanced.',
    hsContext:
      'NYSSMA Level 6 with a high score (28+/28) demonstrates objective technical mastery assessed by expert judges. Level 5+ shows serious commitment. Equivalent systems exist in other states (UIL in Texas, ISSMA in Indiana).',
    indicatesLevel: 'impressive',
    detectionKeywords: ['nyssma', 'level 6', 'adjudication', 'solo festival', 'uil', 'issma', 'abrsm', 'rcm exam'],
    detectionConfidence: 'medium',
  },
  {
    term: 'First chair / concertmaster',
    meaning:
      'First chair: highest-ranked player in a section, selected by director or audition. Concertmaster: first chair of the first violin section — the highest-ranked player in the entire orchestra, responsible for tuning and section leadership.',
    hsContext:
      'Concertmaster of a competitive school or youth orchestra is a significant achievement. First chair in a school ensemble shows section-level excellence. Context matters — first chair in a 15-person band vs. a 100-member competitive orchestra are very different.',
    indicatesLevel: 'notable',
    detectionKeywords: ['first chair', 'concertmaster', 'principal player', 'principal chair', 'section leader'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Principal role / lead role',
    meaning:
      'The primary acting role in a theatrical production, carrying the most stage time, dialogue, and dramatic weight. Cast through competitive audition.',
    hsContext:
      'Meaningfulness depends entirely on the program. Lead in a nationally recognized HS theater program (e.g., schools known for theater) is impressive. Lead in a small school\'s annual play is less distinctive. AOs look for program context.',
    indicatesLevel: 'notable',
    detectionKeywords: ['lead role', 'principal role', 'title role', 'starring', 'lead in', 'played the role of'],
    detectionConfidence: 'low',
  },
  {
    term: 'Original composition performed/published',
    meaning:
      'Music written by the student that has been performed publicly or published/recorded. This demonstrates creative output beyond performance — the student is creating art, not just reproducing it.',
    hsContext:
      'Rare for HS students to have compositions performed by established ensembles. Commissioned work is exceptional. Self-published or performed by school ensemble is notable but less distinctive.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['original composition', 'composed', 'premiered', 'commissioned', 'published score', 'my composition'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Conservatory pre-college program',
    meaning:
      'Intensive pre-professional training programs run by conservatories (Juilliard, Curtis, NEC, Manhattan School, Colburn). Students audition and attend weekly or intensive summer sessions alongside conservatory faculty.',
    hsContext:
      'Acceptance rates for top pre-college programs are single-digit. These programs are the direct pipeline to professional careers. Acceptance signals that conservatory-level faculty have validated this student\'s professional potential.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['pre-college', 'precollege', 'juilliard', 'curtis', 'nec', 'colburn', 'interlochen', 'tanglewood', 'aspen'],
    detectionConfidence: 'high',
  },
  {
    term: 'YoungArts',
    meaning:
      'National YoungArts Foundation competition recognizing outstanding HS artists across 10 disciplines. Winners advance through Merit, Honorable Mention, Finalist, and Winner levels. Winners participate in National YoungArts Week.',
    hsContext:
      'YoungArts Finalist or Winner is a nationally recognized distinction. The program has produced many prominent artists. It\'s also a nomination pathway for the Presidential Scholar in the Arts.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['youngarts', 'young arts', 'youngarts finalist', 'youngarts winner', 'presidential scholar in the arts'],
    detectionConfidence: 'high',
  },
  {
    term: 'Ensemble rank / competitive placement',
    meaning:
      'In programs with multiple ensembles (Wind Ensemble vs. Concert Band, Chamber Orchestra vs. Symphony Orchestra), placement in the top ensemble indicates higher skill. Competitive ensembles may tour, perform at ACDA/NAfME, or participate in adjudicated festivals.',
    hsContext:
      'Being in the top ensemble at a school with 3-4 tiered ensembles signals that the director placed this student among the best. Combined with solo achievements, it provides context for ensemble-level skill.',
    indicatesLevel: 'notable',
    detectionKeywords: ['wind ensemble', 'chamber orchestra', 'top ensemble', 'select choir', 'honors ensemble', 'jazz band', 'symphony orchestra'],
    detectionConfidence: 'low',
  },
  {
    term: 'Recital / solo performance hours',
    meaning:
      'A solo recital is an extended performance (30-90 minutes) where the student is the sole or primary performer. Preparing a full recital demonstrates both technical mastery and sustained concentration.',
    hsContext:
      'Giving a full solo recital (not just playing one piece at a concert) is uncommon for HS students and typically indicates serious private study. The venue and audience context matters — a senior recital at a local church vs. a hall rental for invited guests.',
    indicatesLevel: 'notable',
    detectionKeywords: ['solo recital', 'recital', 'senior recital', 'junior recital', 'solo concert'],
    detectionConfidence: 'low',
  },
  {
    term: 'Repertoire difficulty level',
    meaning:
      'The technical difficulty of the pieces a student performs. In classical music, this maps to recognized grading systems (RCM, ABRSM, Henle). Advanced repertoire (Chopin Ballades, Paganini Caprices, Bach Cello Suites) signals serious technical ability.',
    hsContext:
      'A student performing Rachmaninoff Piano Concerto No. 3 at a competition is operating at a fundamentally different level than one performing a Clementi sonatina. Named repertoire pieces give AOs (and our system) a proxy for technical level.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['concerto', 'sonata', 'etude', 'caprice', 'fugue', 'repertoire', 'performed bach', 'performed chopin'],
    detectionConfidence: 'low',
  },
  {
    term: 'Drum major',
    meaning:
      'The student conductor and field leader of a marching band. Selected through audition and interview. Responsible for conducting performances, leading rehearsals, and managing 50-300+ members.',
    hsContext:
      'Drum major combines musical skill with significant leadership responsibility. At large, competitive marching bands (BOA finalist programs), this is an exceptional leadership role managing a quasi-military organization.',
    indicatesLevel: 'notable',
    detectionKeywords: ['drum major', 'field conductor', 'marching band leader'],
    detectionConfidence: 'high',
  },
];

export const PERFORMING_ARTS_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'performing_arts',
  label: 'Performing Arts',
  overview:
    'Performing arts has the widest range of what "good" means across HS activities. All-State is the universal signal that AOs recognize — it\'s externally validated, competitive, and standardized. Below that, context matters enormously: "lead role" means nothing without knowing whether the theater program is competitive. Technical markers like NYSSMA Level 6, conservatory pre-college acceptance, and YoungArts recognition provide the objective benchmarks that separate genuine achievement from padding.',
  ladder,
  technicalDepthMarkers,
};
