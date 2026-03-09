/**
 * Major Alignment Matrix — Activity Domain ↔ Intended Major Mapping
 *
 * Replaces flat keyword-based MAJOR_RELEVANCE_MAP with rich, contextual
 * alignment data. Each domain×major pair includes a relevance tier,
 * numeric boost factor, admissions-informed rationale, and the specific
 * aspects of the activity that matter for that major.
 *
 * Relevance tiers:
 *   critical       (0.8–1.0)  Activity IS the major in practice
 *   core           (0.5–0.7)  Directly demonstrates major-relevant skills
 *   supporting     (0.2–0.4)  Provides complementary / transferable skills
 *   complementary  (0.1–0.2)  Shows intellectual breadth relevant to the major
 *   unrelated      (0.0)      No meaningful connection
 *
 * Sources: NACAC surveys, published AO commentary, Sara Harberson,
 * MIT/Stanford/Harvard admissions blogs, IEC best practices.
 *
 * Cost: $0.00 (pure data, no LLM calls)
 */

import type { MajorAlignmentEntry, DomainMajorAlignment } from './types';

// ============================================================================
// HELPER — build a DomainMajorAlignment entry
// ============================================================================

function domain(
  domainId: string,
  alignments: Record<string, MajorAlignmentEntry>,
  defaultAlignment: MajorAlignmentEntry,
): DomainMajorAlignment {
  return { domainId, alignments, defaultAlignment };
}

// ============================================================================
// DOMAIN DEFINITIONS
// ============================================================================

const STEM_RESEARCH: DomainMajorAlignment = domain(
  'stem_research',
  {
    'computer science': {
      relevance: 'critical',
      boostFactor: 0.9,
      rationale: 'Research demonstrates analytical rigor and independent investigation central to CS',
      relevantAspects: ['algorithmic thinking', 'data analysis', 'experimental methodology', 'publication or presentation'],
    },
    'engineering': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Lab research shows applied problem-solving and iterative design thinking that engineering programs seek',
      relevantAspects: ['experimental design', 'prototyping', 'quantitative analysis', 'technical documentation'],
    },
    'biology': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Lab research directly proves readiness for biology curriculum and graduate-level inquiry',
      relevantAspects: ['wet lab technique', 'data collection', 'hypothesis testing', 'peer review'],
    },
    'medicine/pre-med': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Research experience is a hallmark of competitive medical school applications and shows scientific curiosity',
      relevantAspects: ['clinical observation', 'IRB compliance', 'literature review', 'patient-facing research'],
    },
    'mathematics': {
      relevance: 'core',
      boostFactor: 0.7,
      rationale: 'Quantitative research demonstrates mathematical modeling and proof-driven reasoning',
      relevantAspects: ['statistical analysis', 'mathematical modeling', 'formal proof', 'computational methods'],
    },
    'physics': {
      relevance: 'critical',
      boostFactor: 0.9,
      rationale: 'Physics research at the high school level signals exceptional readiness for theoretical and experimental physics',
      relevantAspects: ['experimental physics', 'data analysis', 'simulation', 'error analysis'],
    },
    'chemistry': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Chemistry research demonstrates hands-on lab competence and scientific rigor AOs value',
      relevantAspects: ['synthesis', 'spectroscopy', 'safety protocol', 'analytical methods'],
    },
    'environmental science': {
      relevance: 'core',
      boostFactor: 0.7,
      rationale: 'Research methodology transfers directly; environmental focus makes it especially relevant',
      relevantAspects: ['field research', 'data collection', 'environmental sampling', 'policy implications'],
    },
    'psychology': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Research experience in any empirical science demonstrates the methodological rigor psychology programs expect',
      relevantAspects: ['experimental design', 'human subjects protocol', 'data analysis', 'literature review'],
    },
    'political science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Research skills transfer to policy analysis, but the domain mismatch is apparent to AOs',
      relevantAspects: ['analytical methodology', 'data interpretation', 'academic writing'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Research shows analytical discipline valued in business, but lacks direct domain relevance',
      relevantAspects: ['data analysis', 'systematic thinking', 'project management'],
    },
    'english': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Research writing and literature review demonstrate academic writing skills, but the connection is tangential',
      relevantAspects: ['academic writing', 'literature review', 'critical analysis'],
    },
    'art': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'STEM research does not demonstrate creative or artistic capability',
    },
    'music': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between lab research and musical training or performance',
    },
    'theater': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'STEM research does not demonstrate theatrical or performance skills',
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.15,
    rationale: 'Research experience shows intellectual curiosity and academic discipline valued across fields',
  },
);

const STEM_COMPETITION: DomainMajorAlignment = domain(
  'stem_competition',
  {
    'computer science': {
      relevance: 'critical',
      boostFactor: 0.9,
      rationale: 'STEM competitions (USACO, Science Olympiad) directly demonstrate CS aptitude and competitive excellence',
      relevantAspects: ['algorithmic problem-solving', 'time-pressured coding', 'mathematical reasoning', 'competitive ranking'],
    },
    'engineering': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Engineering competitions (Science Olympiad, robotics events) prove hands-on design and build capability',
      relevantAspects: ['design challenges', 'prototype building', 'optimization', 'team engineering'],
    },
    'mathematics': {
      relevance: 'critical',
      boostFactor: 0.95,
      rationale: 'Math competitions (AMC/AIME/USAMO) are the gold standard for demonstrating mathematical talent',
      relevantAspects: ['competition placement', 'problem-solving speed', 'proof construction', 'advanced topics'],
    },
    'physics': {
      relevance: 'critical',
      boostFactor: 0.9,
      rationale: 'Physics competitions (USAPhO, F=ma) directly demonstrate aptitude for theoretical and applied physics',
      relevantAspects: ['theoretical physics', 'experimental design', 'competition ranking', 'advanced problem-solving'],
    },
    'chemistry': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Chemistry competitions (USNCO, Chem Olympiad) prove deep chemical knowledge and lab proficiency',
      relevantAspects: ['competition ranking', 'lab practicals', 'theoretical chemistry', 'synthesis problems'],
    },
    'biology': {
      relevance: 'core',
      boostFactor: 0.7,
      rationale: 'Biology competitions (USABO) demonstrate breadth of biological knowledge valued in pre-med and biology tracks',
      relevantAspects: ['biological knowledge', 'competition ranking', 'lab technique', 'scientific reasoning'],
    },
    'medicine/pre-med': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'STEM competition success signals scientific aptitude valued in medical admissions',
      relevantAspects: ['scientific reasoning', 'competitive achievement', 'biology/chemistry mastery'],
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'STEM competition skills transfer to environmental research, but limited direct overlap',
      relevantAspects: ['scientific methodology', 'data analysis', 'quantitative reasoning'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Quantitative reasoning from competitions supports research psychology, but domain gap is significant',
      relevantAspects: ['statistical reasoning', 'analytical thinking', 'research orientation'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Competitive achievement and quantitative skills are valued in business, especially quantitative finance',
      relevantAspects: ['competitive drive', 'quantitative analysis', 'strategic thinking'],
    },
    'political science': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Shows intellectual rigor but lacks domain relevance to political science',
    },
    'english': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'STEM competitions do not demonstrate literary or writing capability',
    },
    'art': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between STEM competitions and artistic practice',
    },
    'music': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'STEM competitions do not demonstrate musical talent or training',
    },
    'theater': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No connection between STEM competitive achievement and theatrical performance',
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.1,
    rationale: 'STEM competition success shows intellectual capability and competitive drive',
  },
);

const CODING_ENGINEERING: DomainMajorAlignment = domain(
  'coding_engineering',
  {
    'computer science': {
      relevance: 'critical',
      boostFactor: 0.95,
      rationale: 'Building software is CS in practice — the strongest possible signal of readiness for a CS major',
      relevantAspects: ['shipped products', 'users/downloads', 'technical complexity', 'open source contributions'],
    },
    'engineering': {
      relevance: 'critical',
      boostFactor: 0.85,
      rationale: 'Software and hardware projects demonstrate the build-test-iterate cycle central to all engineering',
      relevantAspects: ['system design', 'prototyping', 'technical problem-solving', 'iteration and testing'],
    },
    'mathematics': {
      relevance: 'core',
      boostFactor: 0.5,
      rationale: 'Coding demonstrates applied mathematics and computational thinking',
      relevantAspects: ['algorithm design', 'optimization', 'computational modeling', 'data structures'],
    },
    'physics': {
      relevance: 'core',
      boostFactor: 0.5,
      rationale: 'Computational physics and simulation projects bridge coding and physics naturally',
      relevantAspects: ['simulation', 'modeling', 'data visualization', 'computational methods'],
    },
    'business': {
      relevance: 'core',
      boostFactor: 0.55,
      rationale: 'Building products with users demonstrates entrepreneurial thinking and market awareness',
      relevantAspects: ['product development', 'user metrics', 'market validation', 'revenue generation'],
    },
    'biology': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Bioinformatics and data analysis tools bridge coding and biology, but domain overlap is narrow',
      relevantAspects: ['bioinformatics', 'data analysis tools', 'computational biology'],
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Health tech projects show applied problem-solving in healthcare, valued as a differentiator',
      relevantAspects: ['health technology', 'patient data tools', 'accessibility solutions'],
    },
    'chemistry': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Computational chemistry is a niche but growing field where coding skills directly apply',
      relevantAspects: ['molecular modeling', 'data analysis', 'simulation'],
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Environmental data analysis and monitoring tools bridge coding and environmental science',
      relevantAspects: ['sensor systems', 'data visualization', 'environmental monitoring', 'GIS tools'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Data analysis and research tool building demonstrate computational skills used in research psychology',
      relevantAspects: ['data analysis', 'survey tools', 'behavioral modeling'],
    },
    'political science': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Civic tech or data journalism projects show applied coding in a political context',
      relevantAspects: ['civic technology', 'data visualization', 'transparency tools'],
    },
    'english': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Digital humanities and NLP projects show interdisciplinary breadth',
      relevantAspects: ['text analysis', 'digital humanities', 'NLP projects'],
    },
    'art': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Creative coding and generative art bridge technology and artistic expression',
      relevantAspects: ['creative coding', 'generative art', 'interactive installations'],
    },
    'music': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Music technology and audio programming bridge coding and music',
      relevantAspects: ['audio programming', 'music software', 'synthesis tools'],
    },
    'theater': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Technical theater and stage technology show applied engineering in creative contexts',
      relevantAspects: ['stage technology', 'lighting systems', 'projection mapping'],
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.15,
    rationale: 'Coding and engineering skills show technical problem-solving ability valued in many fields',
  },
);

const DEBATE_SPEECH: DomainMajorAlignment = domain(
  'debate_speech',
  {
    'political science': {
      relevance: 'critical',
      boostFactor: 0.9,
      rationale: 'Debate and speech directly practice argumentation, policy analysis, and civic engagement central to political science',
      relevantAspects: ['policy debate', 'argumentation', 'evidence synthesis', 'public speaking'],
    },
    'english': {
      relevance: 'core',
      boostFactor: 0.65,
      rationale: 'Debate develops rhetorical analysis, persuasive writing, and critical reading central to English studies',
      relevantAspects: ['rhetorical analysis', 'persuasive writing', 'critical thinking', 'oral interpretation'],
    },
    'business': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Competitive debate builds persuasion, negotiation, and public speaking skills directly applicable to business leadership',
      relevantAspects: ['persuasion', 'negotiation', 'public presentation', 'strategic argumentation'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Debate requires understanding human cognition, bias, and persuasion — skills relevant to social psychology',
      relevantAspects: ['cognitive bias awareness', 'audience analysis', 'persuasion psychology', 'empathy'],
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Communication skills and health policy debate demonstrate patient communication readiness',
      relevantAspects: ['health policy analysis', 'communication clarity', 'evidence evaluation'],
    },
    'computer science': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Shows communication and analytical skills, but lacks technical domain relevance',
    },
    'engineering': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Communication skills are valued but insufficient to signal engineering aptitude',
    },
    'biology': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Bioethics debate shows intellectual engagement with science, but not scientific capability',
    },
    'mathematics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Debate does not demonstrate mathematical aptitude',
    },
    'physics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between debate and physics',
    },
    'chemistry': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between debate and chemistry',
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Environmental policy debate demonstrates engagement with climate and sustainability issues',
      relevantAspects: ['environmental policy', 'sustainability advocacy', 'policy analysis'],
    },
    'art': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Debate does not demonstrate artistic capability',
    },
    'music': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between debate and music',
    },
    'theater': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Oral interpretation and dramatic performance in speech events bridge debate and theater',
      relevantAspects: ['oral interpretation', 'dramatic performance', 'stage presence', 'audience engagement'],
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.1,
    rationale: 'Debate and speech develop argumentation and communication skills valued broadly',
  },
);

const PERFORMING_ARTS: DomainMajorAlignment = domain(
  'performing_arts',
  {
    'music': {
      relevance: 'critical',
      boostFactor: 0.95,
      rationale: 'Performance, composition, or ensemble leadership directly demonstrates musical readiness',
      relevantAspects: ['performance level', 'repertoire difficulty', 'ensemble leadership', 'composition', 'competition placement'],
    },
    'theater': {
      relevance: 'critical',
      boostFactor: 0.95,
      rationale: 'Acting, directing, or technical theater work directly proves theatrical capability',
      relevantAspects: ['productions performed', 'roles played', 'directing credits', 'technical design'],
    },
    'art': {
      relevance: 'core',
      boostFactor: 0.65,
      rationale: 'Performing arts demonstrate creative discipline and artistic expression that transfer to visual arts',
      relevantAspects: ['creative process', 'artistic vision', 'audience engagement', 'portfolio development'],
    },
    'english': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Theater connects to dramatic literature and textual interpretation; creative writing overlaps with scriptwriting',
      relevantAspects: ['dramatic literature', 'script analysis', 'creative writing', 'oral interpretation'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Performance requires deep empathy and character study — skills relevant to understanding human behavior',
      relevantAspects: ['character psychology', 'empathy', 'audience perception', 'emotional intelligence'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Arts management, event production, and audience development demonstrate organizational and marketing skills',
      relevantAspects: ['event production', 'audience development', 'arts management', 'fundraising'],
    },
    'political science': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Performance builds public speaking skills, but domain connection is limited',
      relevantAspects: ['public speaking', 'audience engagement'],
    },
    'computer science': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Creative arts demonstrate spatial thinking and design sense, but not technical aptitude',
    },
    'engineering': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Creative arts demonstrate spatial thinking and design sense, but not engineering skills',
    },
    'biology': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between performing arts and biology',
    },
    'medicine/pre-med': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Performance empathy and communication may differentiate a pre-med applicant, but connection is thin',
    },
    'mathematics': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Music theory has mathematical underpinnings, but this connection is rarely meaningful in admissions',
    },
    'physics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between performing arts and physics',
    },
    'chemistry': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between performing arts and chemistry',
    },
    'environmental science': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between performing arts and environmental science',
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.1,
    rationale: 'Performing arts demonstrate creative discipline and collaboration',
  },
);

const ATHLETICS: DomainMajorAlignment = domain(
  'athletics',
  {
    'biology': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Serious athletes develop kinesthetic and physiological awareness, but athletics alone does not demonstrate scientific aptitude',
      relevantAspects: ['sports medicine interest', 'physiology understanding', 'injury rehabilitation'],
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Athletic experience builds body awareness and may inspire sports medicine or rehabilitation careers',
      relevantAspects: ['sports medicine interest', 'team health advocacy', 'injury rehabilitation experience'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Team dynamics, coaching, and sports psychology demonstrate behavioral insight',
      relevantAspects: ['team dynamics', 'mental performance', 'coaching', 'leadership under pressure'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Team leadership, competitive drive, and time management from athletics transfer to business contexts',
      relevantAspects: ['team leadership', 'competitive drive', 'time management', 'performance under pressure'],
    },
    'political science': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Team collaboration and leadership transfer broadly, but no domain connection to political science',
    },
    'english': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Athletics does not demonstrate literary or writing capability',
    },
    'computer science': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Team athletics shows collaboration and resilience applicable to team-based software development',
      relevantAspects: ['teamwork', 'resilience', 'time management'],
    },
    'engineering': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Discipline and teamwork transfer, but no technical engineering signal',
    },
    'mathematics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Athletics does not demonstrate mathematical capability',
    },
    'physics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Athletics does not demonstrate physics aptitude',
    },
    'chemistry': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between athletics and chemistry',
    },
    'environmental science': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between athletics and environmental science',
    },
    'art': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Athletics does not demonstrate artistic capability',
    },
    'music': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between athletics and music',
    },
    'theater': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between athletics and theater',
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.1,
    rationale: 'Athletics demonstrates discipline, teamwork, and time management',
  },
);

const COMMUNITY_SERVICE: DomainMajorAlignment = domain(
  'community_service',
  {
    'medicine/pre-med': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Service demonstrates patient empathy and healthcare exposure that medical schools specifically look for',
      relevantAspects: ['direct patient contact', 'healthcare volunteering', 'empathy development', 'underserved community engagement'],
    },
    'psychology': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Community service involving mentoring, crisis support, or social work demonstrates behavioral insight',
      relevantAspects: ['mentoring', 'crisis support', 'behavioral observation', 'empathy and rapport building'],
    },
    'political science': {
      relevance: 'core',
      boostFactor: 0.55,
      rationale: 'Community organizing and civic engagement directly demonstrate political engagement and social awareness',
      relevantAspects: ['community organizing', 'civic engagement', 'policy advocacy', 'voter registration'],
    },
    'environmental science': {
      relevance: 'core',
      boostFactor: 0.55,
      rationale: 'Environmental service (conservation, cleanup, advocacy) directly aligns with environmental science values',
      relevantAspects: ['conservation work', 'environmental cleanup', 'sustainability advocacy', 'habitat restoration'],
    },
    'english': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Tutoring and literacy programs demonstrate teaching ability and engagement with language and reading',
      relevantAspects: ['literacy tutoring', 'ESL teaching', 'writing mentorship', 'reading programs'],
    },
    'biology': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Health-focused service (hospital volunteering, health fairs) shows applied interest in biology',
      relevantAspects: ['health education', 'hospital volunteering', 'public health outreach'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Nonprofit leadership and social enterprise demonstrate organizational and management skills',
      relevantAspects: ['nonprofit management', 'fundraising', 'event organization', 'social enterprise'],
    },
    'computer science': {
      relevance: 'supporting',
      boostFactor: 0.2,
      rationale: 'Tech-for-good projects (coding workshops, digital literacy) bridge service and CS',
      relevantAspects: ['coding workshops', 'digital literacy', 'tech accessibility'],
    },
    'engineering': {
      relevance: 'supporting',
      boostFactor: 0.2,
      rationale: 'Engineering service projects (clean water, infrastructure) demonstrate applied engineering for social impact',
      relevantAspects: ['infrastructure projects', 'clean water systems', 'assistive technology'],
    },
    'art': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Arts-based community programs (murals, workshops) demonstrate artistic community engagement',
      relevantAspects: ['community murals', 'arts education', 'public art installations'],
    },
    'music': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Music outreach (teaching, performances at care facilities) shows musical community engagement',
      relevantAspects: ['music education outreach', 'community performances', 'instrument donation drives'],
    },
    'theater': {
      relevance: 'supporting',
      boostFactor: 0.2,
      rationale: 'Community theater outreach and drama education programs bridge service and theatrical arts',
      relevantAspects: ['drama education', 'community theater', 'youth workshops'],
    },
    'mathematics': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Math tutoring and STEM outreach demonstrate teaching ability and mathematical engagement',
      relevantAspects: ['math tutoring', 'STEM outreach', 'educational workshops'],
    },
    'physics': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Service shows character and commitment, but lacks direct physics relevance',
    },
    'chemistry': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Service shows character and commitment, but lacks direct chemistry relevance',
    },
  },
  {
    relevance: 'supporting',
    boostFactor: 0.2,
    rationale: 'Community service demonstrates empathy, leadership, and social awareness valued across disciplines',
  },
);

const ENTREPRENEURSHIP: DomainMajorAlignment = domain(
  'entrepreneurship',
  {
    'business': {
      relevance: 'critical',
      boostFactor: 0.95,
      rationale: 'Launching a venture IS business — the strongest possible signal for business school readiness',
      relevantAspects: ['revenue generation', 'customer acquisition', 'market strategy', 'financial management', 'team building'],
    },
    'computer science': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Tech entrepreneurship demonstrates product development, technical architecture, and shipped software',
      relevantAspects: ['product development', 'technical architecture', 'user growth', 'system scaling'],
    },
    'engineering': {
      relevance: 'core',
      boostFactor: 0.55,
      rationale: 'Hardware or product startups demonstrate engineering design, manufacturing, and iteration',
      relevantAspects: ['product design', 'prototyping', 'manufacturing', 'user testing'],
    },
    'political science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Social ventures and civic tech demonstrate political engagement and systemic thinking',
      relevantAspects: ['civic technology', 'social impact', 'policy innovation'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Understanding user behavior and market psychology demonstrates applied behavioral insight',
      relevantAspects: ['user research', 'behavioral design', 'customer empathy'],
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Green startups and sustainability ventures demonstrate applied environmental commitment',
      relevantAspects: ['sustainability innovation', 'clean energy', 'circular economy', 'environmental impact measurement'],
    },
    'mathematics': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Financial modeling and data analytics in a startup context demonstrate applied mathematics',
      relevantAspects: ['financial modeling', 'analytics', 'pricing optimization'],
    },
    'english': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Content creation and copywriting in business contexts show writing ability applied to commerce',
      relevantAspects: ['content strategy', 'brand storytelling', 'copywriting'],
    },
    'biology': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Biotech startups show applied interest in biology, but require additional scientific evidence',
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Health tech ventures demonstrate problem-solving orientation valued in medicine',
      relevantAspects: ['health tech', 'patient experience', 'healthcare access'],
    },
    'physics': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Hardware startups may touch physics, but entrepreneurship alone does not signal physics aptitude',
    },
    'chemistry': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Limited connection unless the venture is specifically in chemical products or materials',
    },
    'art': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Creative ventures (design studios, fashion brands) demonstrate applied artistic vision',
      relevantAspects: ['brand design', 'creative direction', 'visual identity'],
    },
    'music': {
      relevance: 'supporting',
      boostFactor: 0.2,
      rationale: 'Music industry ventures demonstrate applied musical knowledge and industry understanding',
      relevantAspects: ['music production', 'artist management', 'platform development'],
    },
    'theater': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Theater production companies or event ventures demonstrate creative business acumen',
      relevantAspects: ['production management', 'event planning', 'audience development'],
    },
  },
  {
    relevance: 'supporting',
    boostFactor: 0.2,
    rationale: 'Entrepreneurship demonstrates initiative, problem-solving, and real-world impact across fields',
  },
);

const WORK_EMPLOYMENT: DomainMajorAlignment = domain(
  'work_employment',
  {
    'business': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Real work experience — especially with increasing responsibility — is valued direct evidence for business programs',
      relevantAspects: ['customer interaction', 'revenue responsibility', 'management experience', 'professional growth'],
    },
    'computer science': {
      relevance: 'core',
      boostFactor: 0.55,
      rationale: 'Tech industry internships or freelance development provide direct CS experience',
      relevantAspects: ['software development', 'technical internship', 'freelance coding', 'IT support'],
    },
    'engineering': {
      relevance: 'core',
      boostFactor: 0.5,
      rationale: 'Engineering internships or technical employment provide hands-on professional engineering experience',
      relevantAspects: ['engineering internship', 'technical problem-solving', 'manufacturing', 'design work'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Work in people-facing roles demonstrates interpersonal skills and behavioral observation',
      relevantAspects: ['customer service', 'mentoring', 'team management', 'conflict resolution'],
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.4,
      rationale: 'Healthcare employment (CNA, medical scribe, clinic work) provides clinical exposure valued by med schools',
      relevantAspects: ['clinical experience', 'patient interaction', 'medical scribing', 'healthcare exposure'],
    },
    'political science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Government internships or political campaign work provide applied political experience',
      relevantAspects: ['government internship', 'campaign work', 'legislative office', 'policy research'],
    },
    'english': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Writing-related employment (journalism, editing, content creation) demonstrates professional writing',
      relevantAspects: ['professional writing', 'editing', 'journalism', 'content creation'],
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Environmental field work or conservation employment provides applied environmental experience',
      relevantAspects: ['field work', 'conservation employment', 'environmental monitoring', 'park service'],
    },
    'biology': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Lab technician roles or healthcare employment demonstrate applied biology interest',
      relevantAspects: ['lab work', 'healthcare employment', 'veterinary assisting', 'research assistant'],
    },
    'mathematics': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Finance or analytics employment shows applied math, but most work experience lacks direct math relevance',
    },
    'physics': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Limited connection unless employment is in a physics-related technical field',
    },
    'chemistry': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Lab technician or pharmacy employment shows applied chemistry interest',
      relevantAspects: ['laboratory employment', 'pharmacy work', 'chemical handling'],
    },
    'art': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Design, gallery, or creative employment demonstrates professional artistic engagement',
      relevantAspects: ['graphic design work', 'gallery employment', 'photography', 'creative freelance'],
    },
    'music': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Music instruction, studio work, or performance gigs demonstrate professional musical engagement',
      relevantAspects: ['music instruction', 'studio recording', 'performance gigs', 'music retail'],
    },
    'theater': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Theater employment (stage management, production) demonstrates professional theatrical experience',
      relevantAspects: ['stage management', 'production work', 'venue management', 'box office'],
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.15,
    rationale: 'Work experience demonstrates maturity, responsibility, and real-world skills valued across fields',
  },
);

const LEADERSHIP_GOVERNMENT: DomainMajorAlignment = domain(
  'leadership_government',
  {
    'political science': {
      relevance: 'critical',
      boostFactor: 0.9,
      rationale: 'Student government and civic leadership directly practice political engagement, governance, and policy',
      relevantAspects: ['governance experience', 'policy development', 'constituent representation', 'legislative process'],
    },
    'business': {
      relevance: 'core',
      boostFactor: 0.65,
      rationale: 'Organizational leadership demonstrates management, decision-making, and team-building skills central to business',
      relevantAspects: ['organizational management', 'budget oversight', 'team leadership', 'strategic planning'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Leading diverse groups develops understanding of group dynamics, motivation, and interpersonal behavior',
      relevantAspects: ['group dynamics', 'motivation', 'conflict resolution', 'organizational behavior'],
    },
    'english': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Leadership roles require persuasive writing (speeches, proposals) relevant to English studies',
      relevantAspects: ['speech writing', 'persuasive communication', 'public address'],
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Healthcare leadership or health policy advocacy connects leadership to medicine',
      relevantAspects: ['health policy advocacy', 'wellness programs', 'healthcare access initiatives'],
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Environmental policy advocacy and sustainability leadership demonstrate environmental commitment',
      relevantAspects: ['sustainability initiatives', 'environmental policy', 'green campus programs'],
    },
    'computer science': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Leadership shows organizational skills, but lacks technical CS signal',
    },
    'engineering': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Project management skills transfer, but engineering aptitude requires technical demonstration',
    },
    'biology': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Leadership shows commitment and initiative, but not scientific capability',
    },
    'mathematics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Student government does not demonstrate mathematical aptitude',
    },
    'physics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between student government and physics',
    },
    'chemistry': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between student government and chemistry',
    },
    'art': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Arts advocacy in leadership roles shows cultural appreciation but not artistic skill',
    },
    'music': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'Student government does not demonstrate musical capability',
    },
    'theater': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Leadership communication and public presence have minor theatrical overlap',
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.1,
    rationale: 'Leadership and governance demonstrate initiative, responsibility, and organizational skills',
  },
);

const ACADEMIC: DomainMajorAlignment = domain(
  'academic',
  {
    'mathematics': {
      relevance: 'core',
      boostFactor: 0.6,
      rationale: 'Academic clubs, honor societies, and academic competitions demonstrate scholastic discipline and intellectual curiosity',
      relevantAspects: ['math league', 'academic decathlon', 'tutoring', 'honor society'],
    },
    'computer science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Academic engagement shows intellectual discipline, but lacks specific CS technical demonstration',
      relevantAspects: ['academic competition', 'intellectual curiosity', 'scholastic achievement'],
    },
    'engineering': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Academic rigor transfers, but engineering programs want to see building and design',
    },
    'biology': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Science honor societies and academic competitions demonstrate scientific engagement',
      relevantAspects: ['science honor society', 'biology club', 'academic competitions'],
    },
    'medicine/pre-med': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Academic achievement is valued by medical schools as evidence of scholastic capability',
      relevantAspects: ['academic excellence', 'science clubs', 'tutoring'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'FBLA, DECA, and business-focused academic clubs demonstrate business interest and knowledge',
      relevantAspects: ['FBLA/DECA', 'economics club', 'academic competitions'],
    },
    'political science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Model UN, political clubs, and social studies honor societies demonstrate political engagement',
      relevantAspects: ['Model UN', 'political clubs', 'social studies honor society'],
    },
    'english': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Literary magazines, writing clubs, and English honor societies demonstrate literary engagement',
      relevantAspects: ['literary magazine', 'writing club', 'National English Honor Society', 'book club'],
    },
    'physics': {
      relevance: 'supporting',
      boostFactor: 0.35,
      rationale: 'Physics-focused academic clubs and competitions demonstrate physics engagement',
      relevantAspects: ['physics club', 'Science Olympiad events', 'academic competitions'],
    },
    'chemistry': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Chemistry clubs and academic competitions demonstrate chemistry engagement',
      relevantAspects: ['chemistry club', 'ACS competitions', 'lab demonstrations'],
    },
    'environmental science': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Environmental clubs and sustainability initiatives demonstrate environmental engagement',
      relevantAspects: ['environmental club', 'sustainability projects', 'nature study'],
    },
    'psychology': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Psychology clubs and behavioral science interests demonstrate psychology engagement',
      relevantAspects: ['psychology club', 'peer mentoring', 'behavioral research interest'],
    },
    'art': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Art honor societies and creative academic clubs demonstrate artistic engagement',
      relevantAspects: ['National Art Honor Society', 'art club', 'creative projects'],
    },
    'music': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Music honor societies demonstrate musical achievement and dedication',
      relevantAspects: ['Tri-M Music Honor Society', 'music theory', 'ensemble participation'],
    },
    'theater': {
      relevance: 'supporting',
      boostFactor: 0.2,
      rationale: 'Drama clubs and thespian societies demonstrate theatrical engagement',
      relevantAspects: ['International Thespian Society', 'drama club', 'play reading'],
    },
  },
  {
    relevance: 'supporting',
    boostFactor: 0.2,
    rationale: 'Academic engagement demonstrates intellectual curiosity and scholastic discipline',
  },
);

const FAMILY_RESPONSIBILITY: DomainMajorAlignment = domain(
  'family_responsibility',
  {
    'medicine/pre-med': {
      relevance: 'core',
      boostFactor: 0.5,
      rationale: 'Caregiving demonstrates compassion, patient care skills, and healthcare exposure that AOs value for pre-med',
      relevantAspects: ['caregiving experience', 'medical navigation', 'patient advocacy', 'healthcare system knowledge'],
    },
    'psychology': {
      relevance: 'core',
      boostFactor: 0.5,
      rationale: 'Family caregiving develops deep empathy, emotional intelligence, and understanding of human development',
      relevantAspects: ['emotional support', 'developmental awareness', 'family dynamics', 'stress management'],
    },
    'business': {
      relevance: 'supporting',
      boostFactor: 0.3,
      rationale: 'Managing household responsibilities demonstrates time management, budgeting, and organizational skills',
      relevantAspects: ['budget management', 'scheduling', 'household operations', 'resource allocation'],
    },
    'political science': {
      relevance: 'supporting',
      boostFactor: 0.25,
      rationale: 'Navigating social services and advocacy for family demonstrates systemic understanding',
      relevantAspects: ['social services navigation', 'family advocacy', 'systemic awareness'],
    },
    'english': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Translation and cultural mediation for family demonstrates language and communication skills',
      relevantAspects: ['translation', 'cultural mediation', 'written correspondence'],
    },
    'environmental science': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Limited connection, though family farm work may demonstrate environmental awareness',
    },
    'biology': {
      relevance: 'complementary',
      boostFactor: 0.15,
      rationale: 'Healthcare navigation for family shows medical literacy but not scientific rigor',
    },
    'computer science': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Demonstrates maturity and time management, but no technical CS signal',
    },
    'engineering': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Demonstrates problem-solving and resourcefulness, but no engineering aptitude signal',
    },
    'mathematics': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Budget management shows practical math application, but not mathematical aptitude',
    },
    'physics': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between family responsibility and physics',
    },
    'chemistry': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between family responsibility and chemistry',
    },
    'art': {
      relevance: 'complementary',
      boostFactor: 0.1,
      rationale: 'Family responsibility shows character and resilience, but not artistic capability',
    },
    'music': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between family responsibility and music',
    },
    'theater': {
      relevance: 'unrelated',
      boostFactor: 0.0,
      rationale: 'No meaningful connection between family responsibility and theater',
    },
  },
  {
    relevance: 'complementary',
    boostFactor: 0.1,
    rationale: 'Family responsibility demonstrates maturity, resilience, and selflessness — powerful character signals',
  },
);

// ============================================================================
// MAJOR ALIGNMENT MATRIX
// ============================================================================

/**
 * Complete domain-to-major alignment matrix.
 * Keyed by domain ID matching ExpertiseDomain.domainId.
 *
 * Covers 12 activity domains × 15 majors = 180 unique alignment entries
 * plus sensible defaults for unlisted majors.
 */
export const MAJOR_ALIGNMENT_MATRIX: Map<string, DomainMajorAlignment> = new Map([
  ['stem_research', STEM_RESEARCH],
  ['stem_competition', STEM_COMPETITION],
  ['coding_engineering', CODING_ENGINEERING],
  ['debate_speech', DEBATE_SPEECH],
  ['performing_arts', PERFORMING_ARTS],
  ['athletics', ATHLETICS],
  ['community_service', COMMUNITY_SERVICE],
  ['entrepreneurship', ENTREPRENEURSHIP],
  ['work_employment', WORK_EMPLOYMENT],
  ['leadership_government', LEADERSHIP_GOVERNMENT],
  ['academic', ACADEMIC],
  ['family_responsibility', FAMILY_RESPONSIBILITY],
]);

// ============================================================================
// MAJOR NAME NORMALIZATION
// ============================================================================

/**
 * Maps common major name variants to canonical keys used in alignment entries.
 * Allows callers to pass "Biology", "bio", "Pre-Med", "premed", etc. and
 * still get a match.
 */
const MAJOR_ALIASES: Record<string, string> = {
  // Computer Science
  'cs': 'computer science',
  'comp sci': 'computer science',
  'computer engineering': 'computer science',
  'software engineering': 'computer science',
  'information science': 'computer science',
  'informatics': 'computer science',

  // Engineering
  'mechanical engineering': 'engineering',
  'electrical engineering': 'engineering',
  'civil engineering': 'engineering',
  'aerospace engineering': 'engineering',
  'biomedical engineering': 'engineering',
  'chemical engineering': 'engineering',
  'industrial engineering': 'engineering',
  'materials engineering': 'engineering',

  // Biology
  'bio': 'biology',
  'biological sciences': 'biology',
  'biochemistry': 'biology',
  'molecular biology': 'biology',
  'neuroscience': 'biology',
  'genetics': 'biology',
  'microbiology': 'biology',
  'ecology': 'biology',

  // Medicine / Pre-Med
  'pre-med': 'medicine/pre-med',
  'premed': 'medicine/pre-med',
  'pre med': 'medicine/pre-med',
  'medicine': 'medicine/pre-med',
  'nursing': 'medicine/pre-med',
  'public health': 'medicine/pre-med',
  'health sciences': 'medicine/pre-med',
  'kinesiology': 'medicine/pre-med',

  // Business
  'finance': 'business',
  'economics': 'business',
  'accounting': 'business',
  'marketing': 'business',
  'management': 'business',
  'entrepreneurship': 'business',
  'business administration': 'business',

  // Political Science
  'poli sci': 'political science',
  'government': 'political science',
  'politics': 'political science',
  'international relations': 'political science',
  'public policy': 'political science',
  'law': 'political science',
  'pre-law': 'political science',

  // English
  'english literature': 'english',
  'creative writing': 'english',
  'literature': 'english',
  'writing': 'english',
  'journalism': 'english',
  'communications': 'english',
  'rhetoric': 'english',

  // Mathematics
  'math': 'mathematics',
  'applied mathematics': 'mathematics',
  'statistics': 'mathematics',
  'actuarial science': 'mathematics',
  'data science': 'mathematics',

  // Physics
  'astrophysics': 'physics',
  'applied physics': 'physics',
  'biophysics': 'physics',

  // Chemistry
  'chem': 'chemistry',
  'chemical sciences': 'chemistry',

  // Environmental Science
  'environmental studies': 'environmental science',
  'environmental engineering': 'environmental science',
  'earth science': 'environmental science',
  'geology': 'environmental science',
  'climate science': 'environmental science',
  'sustainability': 'environmental science',

  // Psychology
  'psych': 'psychology',
  'cognitive science': 'psychology',
  'behavioral science': 'psychology',
  'social psychology': 'psychology',
  'developmental psychology': 'psychology',

  // Art
  'visual arts': 'art',
  'fine arts': 'art',
  'graphic design': 'art',
  'studio art': 'art',
  'art history': 'art',
  'design': 'art',
  'illustration': 'art',
  'animation': 'art',
  'photography': 'art',
  'architecture': 'art',

  // Music
  'music performance': 'music',
  'music education': 'music',
  'music production': 'music',
  'music composition': 'music',
  'musicology': 'music',

  // Theater
  'theatre': 'theater',
  'drama': 'theater',
  'acting': 'theater',
  'film': 'theater',
  'film studies': 'theater',
  'performing arts': 'theater',
  'dance': 'theater',
};

/**
 * Normalize a major name to its canonical key.
 * Handles case-insensitive matching and common aliases.
 */
function normalizeMajor(intendedMajor: string): string {
  const lower = intendedMajor.toLowerCase().trim();

  // Direct match against canonical names
  const canonicalNames = [
    'computer science', 'engineering', 'biology', 'medicine/pre-med',
    'business', 'political science', 'english', 'mathematics',
    'physics', 'chemistry', 'environmental science', 'psychology',
    'art', 'music', 'theater',
  ];

  if (canonicalNames.includes(lower)) {
    return lower;
  }

  // Alias lookup
  const alias = MAJOR_ALIASES[lower];
  if (alias) return alias;

  // Partial matching — check if the input contains or is contained by a canonical name
  for (const canonical of canonicalNames) {
    if (lower.includes(canonical) || canonical.includes(lower)) {
      return canonical;
    }
  }

  // No match found — return as-is (will fall through to domain default)
  return lower;
}

// ============================================================================
// DOMAIN ID NORMALIZATION
// ============================================================================

/**
 * Maps variant domain IDs to canonical keys used in the matrix.
 */
const DOMAIN_ALIASES: Record<string, string> = {
  'research': 'stem_research',
  'stem_competitions': 'stem_competition',
  'competition': 'stem_competition',
  'coding': 'coding_engineering',
  'engineering': 'coding_engineering',
  'robotics': 'coding_engineering',
  'debate': 'debate_speech',
  'speech': 'debate_speech',
  'arts_creative': 'performing_arts',
  'music': 'performing_arts',
  'theater': 'performing_arts',
  'dance': 'performing_arts',
  'sports': 'athletics',
  'volunteer': 'community_service',
  'startup': 'entrepreneurship',
  'business': 'entrepreneurship',
  'work': 'work_employment',
  'employment': 'work_employment',
  'internship': 'work_employment',
  'government': 'leadership_government',
  'student_government': 'leadership_government',
  'leadership': 'leadership_government',
  'honor_society': 'academic',
  'club': 'academic',
  'family': 'family_responsibility',
  'caretaking': 'family_responsibility',
};

/**
 * Normalize a domain ID to its canonical key in the matrix.
 */
function normalizeDomainId(domainId: string): string {
  const lower = domainId.toLowerCase().trim();

  // Direct match
  if (MAJOR_ALIGNMENT_MATRIX.has(lower)) {
    return lower;
  }

  // Alias
  const alias = DOMAIN_ALIASES[lower];
  if (alias) return alias;

  return lower;
}

// ============================================================================
// GLOBAL DEFAULT
// ============================================================================

/**
 * Fallback alignment when both domain and major are unknown.
 */
const GLOBAL_DEFAULT_ALIGNMENT: MajorAlignmentEntry = {
  relevance: 'complementary',
  boostFactor: 0.1,
  rationale: 'Activity shows general engagement and personal development without direct major alignment',
};

// ============================================================================
// PUBLIC API
// ============================================================================

/**
 * Look up the alignment between an activity domain and an intended major.
 *
 * Handles domain/major normalization, alias resolution, and graceful fallback:
 *   1. Try exact domain + exact major match
 *   2. Try exact domain + normalized major
 *   3. Fall back to domain's default alignment
 *   4. Fall back to global default alignment
 *
 * @param domainId - Activity domain ID (e.g., "stem_research", "athletics")
 * @param intendedMajor - Student's intended major (e.g., "Computer Science", "pre-med")
 * @returns MajorAlignmentEntry with relevance, boost factor, and rationale
 */
export function getMajorAlignment(domainId: string, intendedMajor: string): MajorAlignmentEntry {
  const normalizedDomain = normalizeDomainId(domainId);
  const domainAlignment = MAJOR_ALIGNMENT_MATRIX.get(normalizedDomain);

  if (!domainAlignment) {
    return GLOBAL_DEFAULT_ALIGNMENT;
  }

  // Try normalized major first
  const normalizedMajor = normalizeMajor(intendedMajor);
  const majorEntry = domainAlignment.alignments[normalizedMajor];

  if (majorEntry) {
    return majorEntry;
  }

  // Try the raw lowercased major (in case it's an exact key we didn't alias)
  const rawEntry = domainAlignment.alignments[intendedMajor.toLowerCase().trim()];
  if (rawEntry) {
    return rawEntry;
  }

  // Fall back to domain default
  return domainAlignment.defaultAlignment;
}

/**
 * Get the relevance category for a domain-major pair.
 * Backward-compatible function that returns only the relevance tier,
 * mapping 'critical' down to 'core' for consumers that don't distinguish them.
 *
 * @param domainId - Activity domain ID
 * @param intendedMajor - Student's intended major
 * @returns Relevance category: 'core' | 'supporting' | 'complementary' | 'unrelated'
 */
export function getMajorRelevanceCategory(
  domainId: string,
  intendedMajor: string,
): 'core' | 'supporting' | 'complementary' | 'unrelated' {
  const alignment = getMajorAlignment(domainId, intendedMajor);

  // Map 'critical' to 'core' for backward compatibility —
  // callers that only need 4 tiers treat critical and core equivalently
  if (alignment.relevance === 'critical') {
    return 'core';
  }

  return alignment.relevance;
}
