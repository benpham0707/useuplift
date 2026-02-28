/**
 * Leadership & Student Government — Impressiveness Calibration
 *
 * Covers: Student government (class/school-wide), club leadership,
 * community organization founding, district/state/national youth councils,
 * legislative advocacy, student advisory boards.
 *
 * Key insight for AOs: Leadership is the most COMMON claim on applications
 * and therefore the hardest to differentiate. "Club president" appears on
 * nearly every strong application. The differentiator is IMPACT — measurable
 * change in policy, people, or resources — not the title itself.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const ladder: ImpressionEntry[] = [
  {
    level: 'baseline',
    description:
      'Club member or class representative. Attends meetings, participates in events, volunteers at school functions. May hold a minor appointed position (committee member, homeroom rep). Involvement is consistent but undifferentiated.',
    whyImpressive:
      'Not a differentiator. AOs expect club participation from every competitive applicant — it\'s table stakes, not a distinguishing factor. Class representative is typically an uncontested or low-competition election. Without evidence of initiative or impact, this signals participation without leadership.',
    prevalence: 'Nearly universal — the vast majority of applicants to selective schools list club memberships.',
    applicantPercentile: 'Top 60-90%',
    verificationMarkers: [
      'Named specific club or organization',
      'Described regular participation (meetings, events, volunteering)',
      'Mentioned duration of involvement',
    ],
    differentiatorFromBelow: 'At least joined and consistently participated in organized activities.',
    differentiatorFromAbove: 'No leadership role, no initiative taken, no measurable impact on the organization.',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description:
      'Club officer (president, VP, treasurer, secretary) or committee chair. Organized specific events or initiatives. Student council member or class officer. Mentored newer members. Managed a budget or coordinated a team for a project.',
    whyImpressive:
      'AOs recognize that elected/appointed leadership positions require peer trust and organizational responsibility. A club president who organized events and managed a budget is demonstrating real-world skills. However, this is extremely common among selective school applicants — nearly every strong applicant is president of something. The title alone doesn\'t differentiate; what matters is what they DID with the role.',
    prevalence: 'Very common — most competitive applicants hold at least one club officer position.',
    applicantPercentile: 'Top 25-45%',
    verificationMarkers: [
      'Specific officer title with named organization',
      'Described concrete actions taken in the role (not just title)',
      'Event or initiative organized with attendance or outcome',
      'Budget amount managed',
      'Team size coordinated',
      'Specific problem solved or improvement made',
    ],
    differentiatorFromBelow: 'Elected/appointed to a position of responsibility. Took concrete actions that affected the organization.',
    differentiatorFromAbove: 'Impact is limited to the club or immediate school community. No school-wide policy change or external recognition.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description:
      'Student body president/VP or equivalent school-wide leader. Founded a club or organization that achieved sustained membership and activity (not just on paper). Led a school-wide initiative that produced measurable change (policy, fundraising, culture). Served on a school or district advisory board with real decision-making input.',
    whyImpressive:
      'Student body president is one of the few HS leadership roles that AOs immediately understand as significant — it requires winning a school-wide election and representing the entire student body to administration. Founding a club that persists beyond the founder shows genuine organizational ability. Leading a school-wide initiative with measurable outcomes (raised $X, changed Y policy, created Z program) demonstrates executive-level impact. This is where leadership becomes a real differentiator.',
    prevalence: 'Uncommon — only one student body president per school per year. Genuine club founders who create lasting organizations are rare.',
    applicantPercentile: 'Top 8-15%',
    verificationMarkers: [
      'Student body president/VP with school name',
      'Founded organization with current membership count and activities',
      'School-wide initiative with specific outcome (funds raised, policy changed, attendance numbers)',
      'Advisory board membership with described decision-making role',
      'Specific changes implemented with before/after description',
      'Recognition from administration or school board',
    ],
    differentiatorFromBelow: 'School-wide scope and measurable impact vs. club-level responsibility. Created something that didn\'t exist before.',
    differentiatorFromAbove: 'Impact is within the school. No district, state, or national scope. Strong leader within school but not externally recognized.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description:
      'District or state-level student government representative. Led initiative impacting multiple schools or the broader community. Served on city council youth committee or state education advisory board. Organization founded grew to multiple chapters or schools. Testified before school board or local government. Managed significant budget ($5K+) or team (20+ people).',
    whyImpressive:
      'Impact beyond a single school is rare and signals genuine civic leadership capacity. Being selected for district or state student government means adults in authority positions recognized this student\'s capability and maturity. Testimony before a school board or city council shows the student can articulate policy positions to decision-makers. Multi-school impact (a club that expanded to other schools, a policy that changed district-wide) demonstrates scalable leadership that AOs at elite schools specifically look for.',
    prevalence: 'Rare — district/state student government selects perhaps 50-200 students per state.',
    applicantPercentile: 'Top 2-5%',
    verificationMarkers: [
      'District or state student government title with body name',
      'Multi-school or community-wide initiative with specific reach',
      'Testimony or presentation to government body with date and topic',
      'Organization with multiple chapters and combined membership',
      'Budget amount managed ($5K+)',
      'Policy change at district or community level with specific outcome',
      'Selection process described (how they were chosen from larger pool)',
    ],
    differentiatorFromBelow: 'Impact extends beyond single school. External selection by authority figures. Policy-level influence.',
    differentiatorFromAbove: 'Regional but not national. Influential within a district but not a recognized name at the state/national level.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description:
      'State-level elected office (state student government president, youth commission chair). National youth council or advisory board member. Legislative testimony at state or federal level. Founded organization that became a registered nonprofit or expanded nationally. Recognized by state/national figures (governor\'s citation, congressional recognition). Led initiative with community-wide or state-wide policy impact.',
    whyImpressive:
      'This student is already operating as a civic leader at a level most adults never reach. Testifying before a state legislature or serving on a national youth advisory board means institutional decision-makers view this teenager as a credible voice. Founding a nonprofit that achieves national reach demonstrates extraordinary organizational capability. AOs at schools known for producing political leaders (Harvard, Georgetown, Yale, Princeton) immediately recognize this as a future leader in public life. This is profile-defining.',
    prevalence: 'Extremely rare — perhaps 50-100 HS students nationally hold state or national youth leadership positions per year.',
    applicantPercentile: 'Top 0.1%',
    verificationMarkers: [
      'State-level title with specific body and state',
      'National youth council or advisory board with organization name',
      'State or federal legislative testimony with bill/topic and date',
      'Registered nonprofit with EIN and described impact',
      'Recognition from elected officials with specific citation',
      'National media coverage of initiative',
      'Multi-state organizational reach with chapter count',
    ],
    differentiatorFromBelow: 'State or national scope. Institutional recognition. Policy impact at scale.',
    differentiatorFromAbove: 'This is the ceiling for HS leadership and government.',
    tierRange: [1],
  },
];

const technicalDepthMarkers: TechnicalDepthMarker[] = [
  {
    term: 'Budget managed',
    meaning:
      'The dollar amount of organizational funds the student had authority over. Managing a budget requires financial planning, allocation decisions, and accountability.',
    hsContext:
      'Budget size is a concrete proxy for responsibility scope. Managing a $500 club budget is standard; managing $5K+ for a school-wide event shows real fiscal responsibility; managing $20K+ (large fundraiser, prom, student government) is exceptional for a HS student.',
    indicatesLevel: 'notable',
    detectionKeywords: ['budget', 'managed budget', 'allocated', 'fundraising', 'treasury', 'finances', 'fiscal'],
    detectionConfidence: 'medium',
  },
  {
    term: 'People led / team size',
    meaning:
      'The number of people the student directly supervised, coordinated, or managed. Leading 5 people in a club is different from leading 50 in a school-wide initiative or 200 in a community event.',
    hsContext:
      'Team size contextualizes leadership scope. Leading 5-10 club members is standard; coordinating 20-50 people for an event shows organizational capability; managing 100+ volunteers or members is exceptional.',
    indicatesLevel: 'notable',
    detectionKeywords: ['led', 'managed', 'coordinated', 'supervised', 'oversaw', 'team of', 'volunteers', 'members'],
    detectionConfidence: 'low',
  },
  {
    term: 'Policy implemented / changed',
    meaning:
      'A rule, procedure, or policy at the school, district, or community level that the student advocated for and successfully changed. This is the strongest evidence of leadership impact.',
    hsContext:
      'Policy change is the gold standard of leadership evidence. It means the student identified a problem, proposed a solution, and convinced authority figures to implement it. Examples: changing school lunch policy, implementing a new honor code, creating a mental health initiative.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['policy', 'implemented', 'changed policy', 'new rule', 'established', 'reformed', 'advocacy', 'proposed and adopted'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Organization founded',
    meaning:
      'Created a new club, nonprofit, initiative, or organization from scratch. The key test: does it have sustained activity and membership, or was it just created for the application?',
    hsContext:
      'Founded organizations are heavily scrutinized by AOs because they\'re easy to claim and hard to verify. The differentiator is sustainability: Does the org still exist? Does it have members beyond the founder\'s friends? Has it produced concrete outcomes? A club that dies after the founder graduates was probably padding.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['founded', 'co-founded', 'created', 'established', 'started', 'launched', 'initiated'],
    detectionConfidence: 'medium',
  },
  {
    term: 'School-wide initiative',
    meaning:
      'A project, event, or program that affected the entire school population (not just a single club or class). Examples: school-wide recycling program, mental health awareness week, new student orientation redesign.',
    hsContext:
      'School-wide initiatives demonstrate the ability to influence beyond a small group. The key is measurable impact — "organized a school-wide event" is vague; "organized mental health week with 800 attendees and resulting in new counseling hours" is concrete.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['school-wide', 'schoolwide', 'entire school', 'all students', 'whole school', 'campus-wide'],
    detectionConfidence: 'medium',
  },
  {
    term: 'District representative / state student government',
    meaning:
      'Selected or elected to represent students at the district or state level. District student advisory committees involve students in school board decisions. State student government associations (e.g., NASC) represent student voices at the state level.',
    hsContext:
      'Selection for district or state positions means adults in authority found this student capable of representing peers at a policy level. This is a significant step above school-level leadership and indicates civic engagement maturity.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['district representative', 'state student government', 'school board', 'advisory committee', 'nasc', 'district council'],
    detectionConfidence: 'high',
  },
  {
    term: 'Legislative testimony',
    meaning:
      'Formally addressing a legislative body (school board, city council, state legislature, congressional committee) on a policy issue. Requires preparation of testimony, often invitation from officials.',
    hsContext:
      'A HS student testifying before a legislative body is rare and powerful. It means officials considered this student\'s perspective valuable enough to include in formal proceedings. This is one of the strongest civic leadership markers available.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['testified', 'testimony', 'addressed', 'spoke before', 'school board', 'city council', 'legislature', 'congressional'],
    detectionConfidence: 'high',
  },
  {
    term: 'Registered nonprofit / 501(c)(3)',
    meaning:
      'A formally registered nonprofit organization with tax-exempt status (501(c)(3) in the US). Requires IRS application, articles of incorporation, bylaws, and a board of directors.',
    hsContext:
      'Achieving 501(c)(3) status demonstrates serious organizational commitment and legal sophistication. However, AOs look beyond the registration to actual impact — a nonprofit with no programs or fundraising is just paperwork.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['nonprofit', 'non-profit', '501c3', '501(c)(3)', 'registered charity', 'tax-exempt', 'ein'],
    detectionConfidence: 'high',
  },
];

export const LEADERSHIP_GOVERNMENT_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'leadership_government',
  label: 'Leadership & Student Government',
  overview:
    'Leadership is the most claimed and least differentiating activity category on college applications. Nearly every competitive applicant is "president" of something. AOs have learned to look past titles entirely and focus on IMPACT: What changed because of this student\'s leadership? The ladder here is defined by scope of impact (club → school → district → state → national) and evidence of measurable change (people affected, policies changed, resources mobilized).',
  ladder,
  technicalDepthMarkers,
};
