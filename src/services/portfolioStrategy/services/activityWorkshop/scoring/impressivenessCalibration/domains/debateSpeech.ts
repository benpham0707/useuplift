/**
 * Debate, Speech & Model UN — Impressiveness Calibration
 *
 * Covers: Policy Debate, Lincoln-Douglas, Public Forum, Congress,
 * Original Oratory, Extemporaneous, Model UN, Mock Trial
 *
 * Key insight for AOs: Debate/speech is one of the few HS activities
 * with a rigorous, nationally standardized competitive ladder. A TOC bid
 * is unambiguous — unlike many activities where "national" can mean anything.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const ladder: ImpressionEntry[] = [
  {
    level: 'baseline',
    description:
      'Participates in school debate team or speech club. Attends local tournaments, occasionally breaks into elimination rounds. May compete in Model UN at invitational conferences.',
    whyImpressive:
      'Not a differentiator at selective schools. AOs see thousands of "debate team member" entries. Without elimination-round success or specific competitive markers, this reads as a participation activity. Shows interest in argumentation but not demonstrated excellence.',
    prevalence: 'Very common — roughly 1 in 5 applicants at selective schools lists some debate/speech involvement.',
    applicantPercentile: 'Top 60-80%',
    verificationMarkers: [
      'Named specific events attended (local invitationals)',
      'Mentioned specific format (PF, LD, Policy, Congress)',
      'Described preparation process (research, briefing, drill)',
    ],
    differentiatorFromBelow: 'At least joined a structured competitive team rather than just classroom participation.',
    differentiatorFromAbove: 'Missing consistent elimination-round success. No tournament placings or speaker awards.',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description:
      'Regular competitor who consistently reaches elimination rounds at local and regional tournaments. Accumulates speaker points/awards. May captain novice team or mentor newer debaters. Active in 2+ formats or serves as club officer.',
    whyImpressive:
      'AOs recognize that reaching elimination rounds means this student is better than the median competitor — not just showing up. Mentoring younger debaters shows leadership capacity. Still, this level is common among strong applicants to selective schools, so it doesn\'t move the needle significantly.',
    prevalence: 'Common among strong applicants — 1 in 8 debate-involved applicants at T30 schools.',
    applicantPercentile: 'Top 30-50%',
    verificationMarkers: [
      'Specific elimination-round record (e.g., "reached quarterfinals at 6 tournaments")',
      'Speaker point averages or speaker awards',
      'Leadership role with described responsibilities (coaching novices, running practice)',
      'Multiple tournament names with results',
    ],
    differentiatorFromBelow: 'Consistent elimination-round success vs. merely attending. Demonstrated competitive trajectory.',
    differentiatorFromAbove: 'No state-level qualification or bid accumulation. Success is regional, not verified at state/national level.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description:
      'State qualifier or finalist. Earns TOC bids (at least 1). Reaches late elimination rounds (semis/finals) at competitive bid tournaments. May be recognized as Best Speaker at significant tournaments. MUN: Best Delegate at competitive conferences.',
    whyImpressive:
      'A TOC bid is one of the most unambiguous achievement markers in any HS activity — it requires winning at a verified competitive tournament. State qualification similarly proves external validation beyond the local bubble. AOs at elite schools know what a bid means; it signals genuine intellectual rigor and competitive excellence, not padding.',
    prevalence: 'Uncommon — fewer than 5% of competitive debaters earn even one TOC bid.',
    applicantPercentile: 'Top 10-20%',
    verificationMarkers: [
      'Named specific bid tournament (e.g., Glenbrooks, Emory, Blake)',
      'State tournament qualification with specific year/placement',
      'Elimination round record at named bid tournaments',
      'Best Speaker/Best Delegate awards with tournament name',
      'TOC bid count',
    ],
    differentiatorFromBelow: 'External validation at state or national-circuit level. Success at bid-level tournaments vs. only local/regional.',
    differentiatorFromAbove: 'Has 1-2 bids but hasn\'t qualified for TOC itself. State qualifier but not champion. Strong but not dominant.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description:
      'TOC qualifier (accumulates enough bids to attend). National tournament finalist (NSDA Nationals, NCFL Grand Nationals). State champion. Multiple TOC bids across the season. MUN: Secretary-General at major conference or consistently wins Best Delegate at HMUN/HNMUN-level conferences.',
    whyImpressive:
      'TOC qualification means this student beat the best debaters from across the country repeatedly throughout the season — it\'s not a single-weekend achievement. A state championship or NSDA Nationals finalist has risen above thousands of competitors through a grueling multi-round elimination process. AOs see this as evidence of exceptional critical thinking, composure under pressure, and sustained excellence. This is the level that genuinely strengthens an application.',
    prevalence: 'Rare — fewer than 200 students qualify for TOC in any given event per year nationwide.',
    applicantPercentile: 'Top 2-5%',
    verificationMarkers: [
      'TOC qualification with event and year',
      'NSDA Nationals elimination-round results',
      'State championship title with state and year',
      'Multiple named bid tournaments with results',
      'National-circuit ranking (if available)',
      'Secretary-General or equivalent leadership at named conference',
    ],
    differentiatorFromBelow: 'Accumulated enough bids to qualify for TOC, or won a state championship. Sustained excellence vs. a single strong result.',
    differentiatorFromAbove: 'Strong at the national level but not the dominant competitor. Qualifier vs. champion.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description:
      'TOC champion or finalist. NSDA National champion. Multiple-year TOC qualifier with deep elimination runs. Recognized as one of the top debaters in the country. May have coached/judged at the college level while still in HS. National-circuit ranking in top 10.',
    whyImpressive:
      'A TOC or NSDA National championship is the pinnacle of HS intellectual competition. This student has outperformed literally the best debaters in the country in a format that demands research depth, logical precision, and rhetorical mastery. AOs — especially at schools with strong debate programs (Harvard, Emory, Northwestern, Georgetown) — immediately recognize this as a signal of a student who will contribute meaningfully to campus intellectual life from day one. This is a profile-defining achievement.',
    prevalence: 'Extremely rare — 2-4 students per year per event at this level nationwide.',
    applicantPercentile: 'Top 0.1%',
    verificationMarkers: [
      'TOC or NSDA Nationals placement (champion, finalist, semifinalist)',
      'National-circuit ranking with source',
      'Multi-year TOC qualification record',
      'Named in debate community publications or results databases',
      'College-level judging or coaching invitations',
    ],
    differentiatorFromBelow: 'Champion vs. qualifier. Nationally recognized name vs. strong competitor.',
    differentiatorFromAbove: 'This is the ceiling for HS debate/speech.',
    tierRange: [1],
  },
];

const technicalDepthMarkers: TechnicalDepthMarker[] = [
  {
    term: 'TOC bid',
    meaning:
      'A qualification earned by reaching late elimination rounds at a Tournament of Champions-qualifying tournament. Each bid tournament has verified competitive standards.',
    hsContext:
      'Fewer than 5% of competitive debaters earn even one bid. Multiple bids signal sustained national-level competitiveness.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['toc', 'bid', 'tournament of champions', 'qualifying tournament'],
    detectionConfidence: 'high',
  },
  {
    term: 'Elimination rounds / break rounds',
    meaning:
      'After preliminary rounds, top competitors advance to single-elimination rounds (octos, quarters, semis, finals). "Breaking" means advancing past prelims.',
    hsContext:
      'Breaking at a local tournament is notable; breaking at a bid tournament is impressive; deep elim runs at bid tournaments are exceptional.',
    indicatesLevel: 'notable',
    detectionKeywords: ['elimination round', 'break round', 'broke', 'elim', 'outrounds', 'out-rounds'],
    detectionConfidence: 'high',
  },
  {
    term: 'Speaker points / speaker awards',
    meaning:
      'Individual performance metric in debate. Judges assign speaker points (typically 26-30 scale) based on argument quality and delivery. Top speaker awards go to highest cumulative scores.',
    hsContext:
      'High speaker points indicate individual excellence independent of partner or team. Best Speaker at a major tournament is a strong signal.',
    indicatesLevel: 'notable',
    detectionKeywords: ['speaker points', 'speaker award', 'best speaker', 'top speaker'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Octafinals / Quarterfinals / Semifinals',
    meaning:
      'Specific elimination round depths. At a large tournament (100+ entries), reaching octafinals means top 16; quarterfinals top 8; semifinals top 4.',
    hsContext:
      'The specific round named reveals tournament size and competitive depth. Quarterfinals at Glenbrooks means something very different from quarters at a local invitational.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['octafinals', 'quarterfinals', 'semifinals', 'finals', 'octos', 'quarters', 'semis'],
    detectionConfidence: 'medium',
  },
  {
    term: 'State qualifier / State tournament',
    meaning:
      'Earned the right to compete at the state championship tournament through district/regional qualification. Standards vary by state but consistently represent top performers.',
    hsContext:
      'State qualification is externally validated — you can\'t inflate your way there. It means outperforming regional competitors in a structured elimination process.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['state qualifier', 'state tournament', 'state championship', 'state finals', 'qualified for state'],
    detectionConfidence: 'high',
  },
  {
    term: 'Congress Presiding Officer (PO)',
    meaning:
      'In Student Congress, the PO manages parliamentary procedure, recognizes speakers, and maintains decorum. Selected POs demonstrate procedural mastery and leadership.',
    hsContext:
      'Being selected as PO at competitive tournaments shows procedural expertise and peer recognition. PO at a national tournament is exceptional.',
    indicatesLevel: 'notable',
    detectionKeywords: ['presiding officer', 'PO', 'congress', 'parliamentary procedure', 'student congress'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Secretary-General (MUN)',
    meaning:
      'The highest student leadership position at a Model UN conference. Responsible for organizing the entire conference, managing staff, and setting the academic standard.',
    hsContext:
      'Secretary-General at a major college-run conference (HMUN, HNMUN, BMUN) is a premier leadership role. At a school-run conference, it\'s less distinctive.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['secretary-general', 'secretary general', 'sec-gen', 'secgen', 'model un', 'mun leadership'],
    detectionConfidence: 'high',
  },
  {
    term: 'NSDA Nationals',
    meaning:
      'The National Speech and Debate Association\'s national tournament — the largest academic competition in the US with 5,000+ qualifiers from all 50 states.',
    hsContext:
      'Qualifying for NSDA Nationals requires winning district qualifiers. Reaching elimination rounds at Nationals places a student among the top performers in the country.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['nsda nationals', 'national tournament', 'nsda', 'national speech and debate'],
    detectionConfidence: 'high',
  },
];

export const DEBATE_SPEECH_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'debate_speech',
  label: 'Debate, Speech & Model UN',
  overview:
    'Debate and speech have one of the most transparent competitive ladders in HS activities. TOC bids and NSDA Nationals qualifications are unambiguous, externally verified achievement markers that AOs at selective schools recognize immediately. The key differentiator is competitive validation: participation tells you nothing, but a TOC bid tells you everything.',
  ladder,
  technicalDepthMarkers,
};
