// @ts-nocheck
/**
 * Comparison Benchmarks Library
 *
 * Pre-built library of activity benchmarks organized by category and tier.
 * The LLM references these instead of generating benchmarks on the fly,
 * reducing API bandwidth and ensuring consistent, researched comparisons.
 *
 * Structure: Category → Tier → Array of benchmark examples
 * Each benchmark includes the activity, typical score range, and context.
 *
 * Sources: Sara Harberson tier framework, Common Data Set reports,
 * MIT/Stanford/Harvard admissions blogs, NACAC surveys
 */

// ============================================================================
// TYPES
// ============================================================================

export interface BenchmarkEntry {
  /** Short activity label */
  activity: string;
  /** Typical score range for this activity at this tier */
  scoreRange: [number, number];
  /** One-line context that makes this benchmark educational */
  context: string;
}

export interface CategoryBenchmarks {
  /** Display name for this category */
  label: string;
  /** Keywords to match activities to this category */
  keywords: string[];
  /** Benchmarks by tier (1-4) */
  tiers: {
    1: BenchmarkEntry[];
    2: BenchmarkEntry[];
    3: BenchmarkEntry[];
    4: BenchmarkEntry[];
  };
}

// ============================================================================
// BENCHMARK DATA
// ============================================================================

export const BENCHMARKS_BY_CATEGORY: Record<string, CategoryBenchmarks> = {
  stem_competition: {
    label: 'STEM Competitions',
    keywords: ['math', 'science', 'olympiad', 'usamo', 'usaco', 'usabo', 'usapho', 'physics', 'chemistry', 'biology', 'informatics', 'programming', 'hackathon', 'competition', 'science bowl', 'science fair'],
    tiers: {
      1: [
        { activity: 'USAMO qualifier', scoreRange: [9, 10], context: 'Top ~500 out of 300,000+ AMC participants (0.17%)' },
        { activity: 'USACO Platinum', scoreRange: [9, 10], context: 'Top ~200 competitive programmers nationally; direct pipeline to IOI selection' },
        { activity: 'Intel/Regeneron STS finalist', scoreRange: [9, 10], context: '40 finalists from ~1,900 applicants; often called "junior Nobel Prize"' },
        { activity: 'ISEF Grand Award winner', scoreRange: [9, 10], context: 'Top project among ~1,800 finalists from 80+ countries' },
        { activity: 'IMO/IPhO team member', scoreRange: [10, 10], context: '6 students represent the US; selection from ~10,000 candidates' },
      ],
      2: [
        { activity: 'AIME qualifier (top score)', scoreRange: [7, 8], context: 'Top ~6,000 of 300,000+ AMC takers (2%); score of 10+ is state-level elite' },
        { activity: 'State Science Olympiad medalist', scoreRange: [7, 8], context: 'Top 3 in state events; teams typically have 200+ competing schools' },
        { activity: 'USACO Gold division', scoreRange: [7, 8], context: 'Top ~1,000 competitive programmers; requires strong algorithmic skills' },
        { activity: 'Regional ISEF qualifier', scoreRange: [7, 8], context: 'Winning a regional fair sends ~10% of projects to ISEF' },
        { activity: 'State math team captain', scoreRange: [7, 8], context: 'Represents entire state; selected from thousands of competitors' },
      ],
      3: [
        { activity: 'AMC 10/12 scorer (Honor Roll)', scoreRange: [5, 6], context: 'Top 5% nationally but below AIME cutoff; shows strong math but not elite' },
        { activity: 'School Science Olympiad team member', scoreRange: [4, 6], context: 'Team participation is common at competitive schools; individual medals add value' },
        { activity: 'Local hackathon participant', scoreRange: [4, 5], context: 'Good initiative but hackathons alone without wins are Tier 3' },
        { activity: 'School math team member', scoreRange: [4, 5], context: '5-10% of students at competitive schools are on math team' },
        { activity: 'USACO Silver division', scoreRange: [5, 6], context: 'Above average programmer but thousands reach this level' },
      ],
      4: [
        { activity: 'Science club member', scoreRange: [1, 3], context: 'Passive membership without competition results or projects' },
        { activity: 'One-time hackathon attendee', scoreRange: [1, 2], context: 'Single event attendance without outcomes' },
        { activity: 'Math tutor (informal)', scoreRange: [2, 3], context: 'Common activity; needs quantified impact to stand out' },
      ],
    },
  },

  stem_research: {
    label: 'STEM Research',
    keywords: ['research', 'lab', 'publication', 'paper', 'journal', 'thesis', 'experiment', 'data', 'professor', 'university research'],
    tiers: {
      1: [
        { activity: 'Published in peer-reviewed journal', scoreRange: [9, 10], context: '<0.1% of high schoolers publish; signals graduate-level capability' },
        { activity: 'RSI (Research Science Institute) alum', scoreRange: [9, 10], context: '80 selected from 3,000+ applicants globally; MIT-hosted, 2.7% acceptance' },
        { activity: 'Named co-author on faculty paper', scoreRange: [9, 10], context: 'Faculty don\'t add names lightly; indicates genuine intellectual contribution' },
        { activity: 'Patent filed as teenager', scoreRange: [9, 10], context: 'Rare enough to signal genuine innovation; 95% of patents are by adults' },
      ],
      2: [
        { activity: 'Summer research at university lab', scoreRange: [7, 8], context: 'Competitive placement (SSP, COSMOS, etc.) adds credibility vs. informal arrangements' },
        { activity: 'Presented at regional conference', scoreRange: [7, 8], context: 'Peer-reviewed presentation shows work withstood scrutiny' },
        { activity: 'Multi-year independent research project', scoreRange: [7, 8], context: 'Sustained inquiry over 1+ years with documented methodology' },
        { activity: 'Mentored by professor with letter', scoreRange: [7, 8], context: 'Faculty recommendation confirming contribution elevates from "intern" to "researcher"' },
      ],
      3: [
        { activity: 'Summer lab intern (assisting)', scoreRange: [4, 6], context: 'Common among applicants to top schools; distinguish by describing YOUR contribution' },
        { activity: 'School science fair project', scoreRange: [4, 5], context: 'Participation is expected; winning state+ elevates to Tier 2' },
        { activity: 'Independent project (no mentorship)', scoreRange: [4, 6], context: 'Self-directed is admirable but needs rigor to compete with mentored work' },
      ],
      4: [
        { activity: 'Shadowed a researcher', scoreRange: [1, 2], context: 'Observation without contribution is Tier 4' },
        { activity: 'Lab clean-up/data entry role', scoreRange: [1, 3], context: 'Administrative lab work doesn\'t demonstrate research capability' },
      ],
    },
  },

  debate_speech: {
    label: 'Debate & Speech',
    keywords: ['debate', 'speech', 'forensics', 'model un', 'mun', 'mock trial', 'public speaking', 'rhetoric', 'policy debate', 'lincoln-douglas', 'congressional debate', 'extemporaneous'],
    tiers: {
      1: [
        { activity: 'TOC (Tournament of Champions) qualifier', scoreRange: [9, 10], context: 'Top ~200 debaters nationally; requires winning bids at major tournaments' },
        { activity: 'NSDA national finalist', scoreRange: [9, 10], context: '~6,000 attend nationals but only ~16 reach final rounds' },
        { activity: 'Best Delegate at major MUN (HMUN, BMUN)', scoreRange: [9, 10], context: 'Top award among 2,000+ delegates at premier conferences' },
        { activity: 'National champion (any NSDA event)', scoreRange: [10, 10], context: 'One student per event per year; pinnacle of high school forensics' },
      ],
      2: [
        { activity: 'State debate champion', scoreRange: [7, 8], context: 'Top debater in state; ~500-2,000 competitors depending on state' },
        { activity: 'Multiple TOC bid accumulator', scoreRange: [7, 8], context: 'Earning bids without qualifying still signals national-circuit competitiveness' },
        { activity: 'Captain of nationally-ranked team', scoreRange: [7, 8], context: 'Leading a top-50 program adds organizational leadership to competitive success' },
        { activity: 'Outstanding Delegate at multiple MUNs', scoreRange: [7, 8], context: 'Consistent awards across conferences shows repeatable skill, not luck' },
      ],
      3: [
        { activity: 'Varsity debater with regional wins', scoreRange: [5, 6], context: 'Competitive but hasn\'t broken into state/national level' },
        { activity: 'MUN delegate with occasional awards', scoreRange: [4, 6], context: 'Participation is common; awards at local conferences add some distinction' },
        { activity: 'Speech team member with school awards', scoreRange: [4, 5], context: 'School-level recognition without advancing to state competition' },
        { activity: 'Debate team captain (local circuit)', scoreRange: [5, 6], context: 'Leadership role valued but needs competitive results to reach Tier 2' },
      ],
      4: [
        { activity: 'MUN club member (no awards)', scoreRange: [1, 3], context: 'MUN participation alone is one of the most common "padding" activities' },
        { activity: 'Debate team member (no competitions)', scoreRange: [1, 2], context: 'Joining without competing signals low engagement' },
        { activity: 'One-time speech event', scoreRange: [1, 2], context: 'Single participation without continuation' },
      ],
    },
  },

  performing_arts: {
    label: 'Performing Arts',
    keywords: ['music', 'band', 'orchestra', 'choir', 'theater', 'drama', 'dance', 'piano', 'violin', 'cello', 'instrument', 'concert', 'recital', 'musical', 'singing', 'acting', 'film'],
    tiers: {
      1: [
        { activity: 'All-National ensemble member', scoreRange: [9, 10], context: '~600 selected from 1M+ music students (0.06%); top of All-State performers' },
        { activity: 'YoungArts finalist', scoreRange: [9, 10], context: '~170 finalists from 11,000+ applicants; US Presidential Scholar pathway' },
        { activity: 'Professional-level performance credits', scoreRange: [9, 10], context: 'Paid performances, professional orchestra/company membership' },
        { activity: 'National competition winner (solo)', scoreRange: [9, 10], context: 'E.g., National Chopin Competition, MTNA national finalist' },
      ],
      2: [
        { activity: 'All-State ensemble member', scoreRange: [7, 8], context: 'Typically 120-300 selected from 5,000-10,000+ state auditionees' },
        { activity: 'Lead role in competitive theater program', scoreRange: [7, 8], context: 'At programs producing multiple state-competition qualifiers' },
        { activity: 'Regional competition winner', scoreRange: [7, 8], context: 'E.g., regional NATS winner, district solo & ensemble superior rating' },
        { activity: 'Student-composed work performed publicly', scoreRange: [7, 8], context: 'Original composition performed by ensemble shows creative and technical mastery' },
      ],
      3: [
        { activity: 'School ensemble section leader', scoreRange: [5, 6], context: 'Leadership within school music program; common at competitive schools' },
        { activity: 'Supporting role in school musical', scoreRange: [4, 5], context: 'Shows commitment but is a common activity' },
        { activity: 'Private lessons for 3+ years', scoreRange: [4, 6], context: 'Duration matters; distinguish by audition results or performances' },
        { activity: 'School concert band member', scoreRange: [4, 5], context: 'Standard participation; needs solo/competition results to elevate' },
      ],
      4: [
        { activity: 'Band/choir member (no audition required)', scoreRange: [1, 3], context: 'Open-enrollment ensembles without competitive selection' },
        { activity: 'Attended a summer music camp', scoreRange: [2, 3], context: 'Pay-to-attend camps are common; competitive-admission camps (Interlochen, Tanglewood) are Tier 2+' },
        { activity: 'Occasional performer at school events', scoreRange: [1, 2], context: 'Informal performances without commitment arc' },
      ],
    },
  },

  athletics: {
    label: 'Athletics',
    keywords: ['sport', 'team', 'varsity', 'captain', 'athlete', 'track', 'swimming', 'soccer', 'basketball', 'football', 'tennis', 'lacrosse', 'volleyball', 'cross country', 'wrestling', 'rowing', 'fencing', 'martial arts', 'golf', 'baseball', 'softball', 'hockey'],
    tiers: {
      1: [
        { activity: 'D1 recruited athlete', scoreRange: [9, 10], context: 'Only ~2% of high school athletes play D1; recruited means coach wants you' },
        { activity: 'National team/Olympic development', scoreRange: [9, 10], context: 'National team selection at any age is extraordinary (<0.01%)' },
        { activity: 'All-American selection', scoreRange: [9, 10], context: 'Top ~50-100 nationally in the sport; elite recognition' },
        { activity: 'State champion (individual sport)', scoreRange: [9, 10], context: 'One winner per weight class/event per state per year' },
      ],
      2: [
        { activity: 'All-State selection (team sport)', scoreRange: [7, 8], context: 'Top ~30-50 in state; scouts and coaches select these players' },
        { activity: 'State championship team starter', scoreRange: [7, 8], context: 'Contributing to a championship team; distinguish starting role vs. bench' },
        { activity: 'Club sport national qualifier', scoreRange: [7, 8], context: 'E.g., club soccer nationals, USA Swimming sectionals qualifier' },
        { activity: 'Team captain with state-level success', scoreRange: [7, 8], context: 'Leadership + competitive success combination valued by admissions' },
      ],
      3: [
        { activity: 'Varsity starter for 2+ years', scoreRange: [5, 6], context: 'Solid commitment; common among applicants at selective schools' },
        { activity: 'JV/Varsity athlete with team awards', scoreRange: [4, 5], context: 'School-level recognition shows dedication but isn\'t distinctive' },
        { activity: 'Club sport regular competitor', scoreRange: [4, 6], context: 'Year-round commitment valued; distinguish by level of competition' },
        { activity: 'Team captain (non-competitive school)', scoreRange: [5, 6], context: 'Leadership is good but needs context on competitive level' },
      ],
      4: [
        { activity: 'JV bench player', scoreRange: [1, 3], context: 'Participation without meaningful playing time or growth' },
        { activity: 'One-season sport try', scoreRange: [1, 2], context: 'Brief attempt without sustained commitment' },
        { activity: 'Intramural/recreational sport', scoreRange: [1, 2], context: 'Casual participation without competitive structure' },
      ],
    },
  },

  community_service: {
    label: 'Community Service & Volunteering',
    keywords: ['volunteer', 'service', 'community', 'nonprofit', 'charity', 'fundrais', 'mentor', 'tutor', 'hospital', 'food bank', 'homeless', 'habitat', 'red cross', 'mission trip', 'outreach'],
    tiers: {
      1: [
        { activity: 'Founded nonprofit with 501(c)(3) status', scoreRange: [9, 10], context: 'Legal incorporation + sustained impact signals genuine commitment beyond resume building' },
        { activity: 'National service award (PVSA Gold+)', scoreRange: [8, 9], context: 'Gold PVSA requires 250+ hours; but impact matters more than hours' },
        { activity: 'Created program serving 500+ people', scoreRange: [9, 10], context: 'Scale of impact distinguishes founders from participants' },
        { activity: 'Community organizing with policy impact', scoreRange: [9, 10], context: 'Changed a local policy, ordinance, or institutional practice through advocacy' },
      ],
      2: [
        { activity: 'Multi-year program leader (100+ served)', scoreRange: [7, 8], context: 'Sustained leadership with measurable beneficiaries is the Tier 2 threshold' },
        { activity: 'Tutoring program creator', scoreRange: [7, 8], context: 'Started and sustained a tutoring initiative; quantify student outcomes' },
        { activity: 'Hospital volunteer 200+ hours', scoreRange: [7, 8], context: 'Sustained medical volunteering with patient interaction, not just filing' },
        { activity: 'Organized major fundraiser ($5K+)', scoreRange: [7, 8], context: 'Dollar amount + cause alignment matters more than the event itself' },
      ],
      3: [
        { activity: 'Regular volunteer at established org', scoreRange: [4, 6], context: 'Weekly volunteering at food bank, shelter, etc. — valuable but common' },
        { activity: 'Peer tutor through school program', scoreRange: [4, 5], context: 'Common activity; quantify number of students helped and outcomes' },
        { activity: 'Church/temple youth group service', scoreRange: [4, 5], context: 'Shows character but is a standard activity; distinguish by specific impact' },
        { activity: 'Habitat for Humanity builds', scoreRange: [4, 6], context: 'Multiple builds show commitment; single trip is Tier 4' },
      ],
      4: [
        { activity: 'One-time service event', scoreRange: [1, 2], context: 'Single beach cleanup or food drive shift without continuation' },
        { activity: 'Required community service hours', scoreRange: [1, 3], context: 'School-mandated hours with no voluntary continuation' },
        { activity: 'Mission trip (one-time)', scoreRange: [2, 3], context: 'Common "voluntourism"; needs sustained follow-up to be meaningful' },
      ],
    },
  },

  leadership_government: {
    label: 'Leadership & Student Government',
    keywords: ['president', 'student government', 'student council', 'class officer', 'student body', 'founded', 'club president', 'nhs', 'national honor society', 'honor society', 'key club'],
    tiers: {
      1: [
        { activity: 'Student body president (large school)', scoreRange: [8, 9], context: 'Elected by 1,000+ students; often school\'s top leadership position' },
        { activity: 'Founded organization with 100+ members', scoreRange: [9, 10], context: 'Building something from nothing at scale is rare and valued' },
        { activity: 'State/national student government officer', scoreRange: [9, 10], context: 'E.g., state DECA president, national FBLA officer — top of competitive pyramid' },
      ],
      2: [
        { activity: 'Student body president (small school)', scoreRange: [7, 8], context: 'Same role, smaller scale; emphasize specific initiatives and outcomes' },
        { activity: 'NHS chapter president with initiatives', scoreRange: [7, 8], context: 'Presidency alone is Tier 3; launching new programs elevates to Tier 2' },
        { activity: 'Club founder with sustained membership', scoreRange: [7, 8], context: 'Club survives beyond founder\'s tenure; 20+ active members' },
        { activity: 'Multi-club officer with unified vision', scoreRange: [7, 8], context: 'Leadership across clubs tied to a theme shows intentional portfolio' },
      ],
      3: [
        { activity: 'NHS member', scoreRange: [3, 4], context: 'Top 10-15% GPA qualifies; membership alone is one of the most common activities listed' },
        { activity: 'Club president (standard school club)', scoreRange: [5, 6], context: '5-10% of students hold president titles; what you DID matters more than the title' },
        { activity: 'Class officer (secretary/treasurer)', scoreRange: [4, 5], context: 'Lower officer roles need specific achievements to stand out' },
        { activity: 'Key Club member', scoreRange: [3, 4], context: 'One of largest high school organizations; membership alone is common' },
      ],
      4: [
        { activity: 'NHS member (no projects)', scoreRange: [1, 3], context: 'Membership without active participation is the definition of resume padding' },
        { activity: 'Club member (no officer role)', scoreRange: [1, 2], context: 'Passive membership without leadership or contributions' },
        { activity: 'Student council representative (inactive)', scoreRange: [1, 2], context: 'Title without action; admissions officers see through this' },
      ],
    },
  },

  entrepreneurship: {
    label: 'Entrepreneurship & Business',
    keywords: ['business', 'startup', 'entrepreneur', 'company', 'sell', 'revenue', 'app', 'website', 'freelance', 'deca', 'fbla', 'bpa', 'economics', 'finance', 'invest', 'trading'],
    tiers: {
      1: [
        { activity: 'Revenue-generating business ($10K+)', scoreRange: [9, 10], context: 'Profitable teen business with real customers is rare; demonstrates execution ability' },
        { activity: 'App/product with 10,000+ users', scoreRange: [9, 10], context: 'User adoption at this scale requires real product-market fit' },
        { activity: 'DECA/FBLA international finalist', scoreRange: [9, 10], context: 'Top ~100 from 200,000+ DECA members; serious competitive achievement' },
        { activity: 'Published/featured in major media', scoreRange: [9, 10], context: 'NYT, Forbes 30 Under 30, TechCrunch coverage validates external recognition' },
      ],
      2: [
        { activity: 'Small business with real customers', scoreRange: [7, 8], context: 'Revenue under $10K but genuine product/service with repeat customers' },
        { activity: 'State DECA/FBLA champion', scoreRange: [7, 8], context: 'State-level win in competitive business organization' },
        { activity: 'App/website with 1,000+ users', scoreRange: [7, 8], context: 'Meaningful traction; distinguish from "launched an app nobody used"' },
        { activity: 'Investment club with real portfolio', scoreRange: [7, 8], context: 'Managing actual money (even small amounts) with documented returns' },
      ],
      3: [
        { activity: 'DECA/FBLA member with regional awards', scoreRange: [5, 6], context: 'Active competitor but hasn\'t reached state/national level' },
        { activity: 'Freelance work (tutoring, design, etc.)', scoreRange: [4, 6], context: 'Self-started income shows initiative; quantify clients and revenue' },
        { activity: 'School store manager', scoreRange: [4, 5], context: 'Good experience but school-organized; distinguish by innovations made' },
        { activity: 'App/website project (small audience)', scoreRange: [4, 5], context: 'Building something shows technical skill; needs users to reach Tier 2' },
      ],
      4: [
        { activity: 'DECA/FBLA member (no competitions)', scoreRange: [1, 3], context: 'Club membership without competing' },
        { activity: 'Etsy/reseller with minimal activity', scoreRange: [1, 2], context: 'Occasional sales without sustained business operation' },
        { activity: '"CEO" of inactive venture', scoreRange: [1, 2], context: 'Self-given title without demonstrable outcomes; admissions sees through this' },
      ],
    },
  },

  writing_journalism: {
    label: 'Writing & Journalism',
    keywords: ['writing', 'newspaper', 'yearbook', 'literary', 'magazine', 'blog', 'journalist', 'editor', 'publication', 'poetry', 'author', 'book', 'novel', 'essay contest', 'scholastic'],
    tiers: {
      1: [
        { activity: 'Scholastic Art & Writing Gold Key (national)', scoreRange: [9, 10], context: '~2,000 national awards from 340,000+ submissions (0.6%)' },
        { activity: 'Published book/novel', scoreRange: [9, 10], context: 'Published by legitimate press (not self-published); extremely rare for teens' },
        { activity: 'National journalism award winner', scoreRange: [9, 10], context: 'E.g., JEA/NSPA award, Columbia Scholastic Press Association Gold Crown' },
        { activity: 'Essay contest national winner', scoreRange: [9, 10], context: 'E.g., Concord Review publication (~5% acceptance), national essay competition win' },
      ],
      2: [
        { activity: 'Editor-in-chief of school publication', scoreRange: [7, 8], context: 'Top editorial position; strongest when paired with publication awards' },
        { activity: 'Scholastic regional Gold Key', scoreRange: [7, 8], context: 'Regional recognition in competitive writing program' },
        { activity: 'Published in recognized literary journal', scoreRange: [7, 8], context: 'Legitimate teen literary magazines with competitive acceptance rates' },
        { activity: 'Multi-year journalist with portfolio', scoreRange: [7, 8], context: 'Consistent published work showing growth and beat coverage' },
      ],
      3: [
        { activity: 'School newspaper section editor', scoreRange: [5, 6], context: 'Mid-level editorial role; needs published work samples to strengthen' },
        { activity: 'Personal blog with regular readership', scoreRange: [4, 6], context: 'Self-publishing is accessible; audience size and quality of writing matter' },
        { activity: 'Yearbook staff member', scoreRange: [4, 5], context: 'Common activity; leadership role or design innovation elevates it' },
        { activity: 'School literary magazine contributor', scoreRange: [4, 5], context: 'Publishing in school outlets is expected; external publication elevates' },
      ],
      4: [
        { activity: 'Newspaper staff writer (occasional)', scoreRange: [1, 3], context: 'Sporadic contributions without sustained commitment' },
        { activity: 'Personal journal/diary', scoreRange: [1, 2], context: 'Private writing isn\'t an extracurricular activity' },
      ],
    },
  },

  visual_arts: {
    label: 'Visual Arts & Design',
    keywords: ['art', 'painting', 'drawing', 'sculpture', 'photography', 'graphic design', 'digital art', 'ceramics', 'portfolio', 'gallery', 'exhibition'],
    tiers: {
      1: [
        { activity: 'Scholastic Art Gold Key (national)', scoreRange: [9, 10], context: 'National recognition in the most prestigious teen art competition' },
        { activity: 'Gallery exhibition (professional venue)', scoreRange: [9, 10], context: 'Curated into a professional gallery; demonstrates art-world validation' },
        { activity: 'YoungArts visual arts finalist', scoreRange: [9, 10], context: '~170 finalists across all arts from 11,000+ applicants' },
      ],
      2: [
        { activity: 'Scholastic Art regional Gold Key', scoreRange: [7, 8], context: 'Regional recognition; multiple Gold Keys strengthen portfolio' },
        { activity: 'AP Art portfolio score of 5', scoreRange: [7, 8], context: 'Top score on demanding portfolio assessment' },
        { activity: 'Commission work / freelance design', scoreRange: [7, 8], context: 'Paid work validates skill level beyond classroom' },
        { activity: 'Student exhibition curator', scoreRange: [7, 8], context: 'Organized school/community exhibition showcasing multiple artists' },
      ],
      3: [
        { activity: 'AP Art student with strong portfolio', scoreRange: [5, 6], context: 'Rigorous course shows commitment; score matters for distinction' },
        { activity: 'School art show participant', scoreRange: [4, 5], context: 'Standard participation; winning school-level awards adds some value' },
        { activity: 'Photography club with published work', scoreRange: [4, 6], context: 'Published photos in school/local media show practical application' },
      ],
      4: [
        { activity: 'Art class student (no portfolio)', scoreRange: [1, 2], context: 'Coursework alone isn\'t an extracurricular' },
        { activity: 'Hobby artist (no exhibitions or competitions)', scoreRange: [1, 3], context: 'Personal practice without external validation' },
      ],
    },
  },

  work_family: {
    label: 'Work Experience & Family Responsibility',
    keywords: ['job', 'work', 'employ', 'intern', 'family business', 'caregiver', 'sibling', 'translate', 'family responsibility', 'breadwinner', 'part-time', 'full-time'],
    tiers: {
      1: [
        { activity: 'Significant family breadwinner (20+ hrs/wk)', scoreRange: [8, 9], context: 'Supporting family financially while maintaining academics shows extraordinary resilience' },
        { activity: 'Internship at elite company with deliverables', scoreRange: [8, 9], context: 'Competitive placement (not nepotism) with documented project outcomes' },
        { activity: 'Promoted to management role as teen', scoreRange: [8, 9], context: 'Earning adult responsibilities through demonstrated competence' },
      ],
      2: [
        { activity: 'Multi-year job with promotions', scoreRange: [7, 8], context: 'Sustained employment with advancement shows reliability and growth' },
        { activity: 'Primary caregiver for family member', scoreRange: [7, 8], context: 'Significant caregiving responsibility alongside academics; context matters enormously' },
        { activity: 'Industry-relevant internship', scoreRange: [7, 8], context: 'Internship aligned with intended major; describe specific contributions' },
        { activity: 'Family business with significant role', scoreRange: [7, 8], context: 'Active operational role (not just "helped out"); quantify responsibilities' },
      ],
      3: [
        { activity: 'Part-time job (1+ year)', scoreRange: [4, 6], context: 'Shows responsibility and time management; common among applicants' },
        { activity: 'Summer job or internship', scoreRange: [4, 5], context: 'Seasonal employment; less distinctive than year-round commitment' },
        { activity: 'Regular babysitting/childcare', scoreRange: [4, 5], context: 'Consistent childcare shows responsibility; needs context on hours and duration' },
      ],
      4: [
        { activity: 'Occasional odd jobs', scoreRange: [1, 2], context: 'Sporadic work without pattern or growth' },
        { activity: 'One-time summer job', scoreRange: [2, 3], context: 'Brief employment without sustained commitment' },
      ],
    },
  },

  social_activism: {
    label: 'Social Impact & Activism',
    keywords: ['activism', 'social justice', 'advocacy', 'campaign', 'protest', 'awareness', 'equity', 'diversity', 'inclusion', 'environmental', 'climate', 'sustainability', 'political', 'civic'],
    tiers: {
      1: [
        { activity: 'Policy change achieved through advocacy', scoreRange: [9, 10], context: 'Getting a law, school policy, or institutional change enacted is rare and impactful' },
        { activity: 'Founded movement with media coverage', scoreRange: [9, 10], context: 'Covered by legitimate media; sustained beyond initial event' },
        { activity: 'National advocacy organization leader', scoreRange: [9, 10], context: 'E.g., state/national director of established advocacy org' },
      ],
      2: [
        { activity: 'Organized sustained campaign', scoreRange: [7, 8], context: 'Multi-month campaign with measurable outcomes (petition signatures, funds raised, attendance)' },
        { activity: 'Environmental initiative with measurable impact', scoreRange: [7, 8], context: 'E.g., documented 30% waste reduction, planted 1,000 trees with tracking' },
        { activity: 'Youth advocacy board member', scoreRange: [7, 8], context: 'Appointed to advisory role for city/county/organization' },
      ],
      3: [
        { activity: 'Environmental club president', scoreRange: [5, 6], context: 'Leadership is good but needs measurable impact beyond "raising awareness"' },
        { activity: 'Organized school awareness events', scoreRange: [4, 5], context: 'School-level events without sustained impact beyond the day' },
        { activity: 'Social media advocacy account', scoreRange: [4, 5], context: 'Online presence needs follower count and real-world impact to be compelling' },
      ],
      4: [
        { activity: 'Signed petitions/attended rallies', scoreRange: [1, 2], context: 'Participation without organization or leadership' },
        { activity: 'Posted about causes on social media', scoreRange: [1, 2], context: 'Performative activism without action' },
        { activity: 'One-time school walkout participant', scoreRange: [1, 2], context: 'Joining a crowd event without personal organizing contribution' },
      ],
    },
  },

  technology: {
    label: 'Technology & Engineering',
    keywords: ['coding', 'programming', 'software', 'robotics', 'frc', 'ftc', 'vex', 'engineering', 'web development', 'machine learning', 'ai', 'cybersecurity', 'open source', 'github'],
    tiers: {
      1: [
        { activity: 'FRC team lead at World Championship', scoreRange: [9, 10], context: 'Top ~400 of 3,600+ FRC teams qualify; leadership role adds distinction' },
        { activity: 'Open source contributor (major project)', scoreRange: [9, 10], context: 'Merged PRs on projects with 1,000+ stars; demonstrates real-world engineering' },
        { activity: 'App/platform with significant user base', scoreRange: [9, 10], context: '10,000+ users indicates genuine product-market fit beyond school project' },
        { activity: 'CyberPatriot national finalist', scoreRange: [9, 10], context: 'Top teams from 5,000+ competing units nationally' },
      ],
      2: [
        { activity: 'FRC/FTC team with state awards', scoreRange: [7, 8], context: 'State championship or innovation award; specialize your role (programmer, designer)' },
        { activity: 'Personal coding project with users', scoreRange: [7, 8], context: 'Self-built tool/app that people actually use (100+ users minimum)' },
        { activity: 'Won regional hackathon/competition', scoreRange: [7, 8], context: 'Competitive win validates technical skills beyond self-assessment' },
        { activity: 'VEX Robotics state competitor', scoreRange: [7, 8], context: 'State-level qualification in VEX shows engineering competence' },
      ],
      3: [
        { activity: 'Robotics club member (regular competitor)', scoreRange: [4, 6], context: 'Active participation is good; specify YOUR technical contributions, not team results' },
        { activity: 'Self-taught programmer with portfolio', scoreRange: [4, 6], context: 'GitHub profile with completed projects; quality over quantity' },
        { activity: 'CS course sequence (AP CS A/P)', scoreRange: [4, 5], context: 'Coursework is expected for CS applicants; projects distinguish' },
        { activity: 'School tech support / IT assistant', scoreRange: [4, 5], context: 'Practical skills but not distinctive; needs innovation component' },
      ],
      4: [
        { activity: 'Robotics club member (no role/competitions)', scoreRange: [1, 3], context: 'Passive membership without technical contribution' },
        { activity: 'Completed online coding tutorial', scoreRange: [1, 2], context: 'Self-study is good but isn\'t an extracurricular activity' },
        { activity: 'Built a basic personal website', scoreRange: [2, 3], context: 'Template-based sites don\'t demonstrate engineering ability' },
      ],
    },
  },

  medical_health: {
    label: 'Medical & Health',
    keywords: ['medical', 'health', 'hospital', 'clinical', 'emt', 'nursing', 'patient', 'shadowing', 'pre-med', 'public health', 'epidemiology'],
    tiers: {
      1: [
        { activity: 'NIH Summer Internship', scoreRange: [9, 10], context: '<200 HS students selected nationally for biomedical research' },
        { activity: 'Medical journal co-author', scoreRange: [9, 10], context: 'HS student publishing in medical literature is extremely rare' },
        { activity: 'Emergency Medical Technician certification + active service', scoreRange: [8, 9], context: 'Professional certification + active emergency response' },
      ],
      2: [
        { activity: '500+ hour hospital volunteer with patient interaction', scoreRange: [7, 8], context: 'Sustained clinical volunteering with direct patient contact' },
        { activity: 'Clinical research assistant at university', scoreRange: [7, 8], context: 'University-affiliated clinical research with mentorship' },
        { activity: 'CNA certification + regular work', scoreRange: [7, 8], context: 'Professional nursing assistant credential as HS student' },
      ],
      3: [
        { activity: 'Regular hospital volunteer (100+ hours)', scoreRange: [4, 6], context: 'Consistent medical volunteering; common among pre-med applicants' },
        { activity: 'Clinical shadowing 50+ hours', scoreRange: [4, 5], context: 'Observation experience; valuable but doesn\'t demonstrate direct contribution' },
        { activity: 'Health fair organizer', scoreRange: [5, 6], context: 'Community health initiative shows leadership in medical interest' },
      ],
      4: [
        { activity: 'One-time hospital visit/shadowing', scoreRange: [1, 2], context: 'Single observation day without sustained engagement' },
        { activity: 'Listed \'wants to be a doctor\' without clinical experience', scoreRange: [1, 2], context: 'Aspiration without action' },
      ],
    },
  },

  academic_enrichment: {
    label: 'Academic Enrichment',
    keywords: ['academic', 'honor society', 'nhs', 'tutoring', 'decathlon', 'quiz bowl', 'academic team', 'national honor society', 'mu alpha theta', 'tri-m'],
    tiers: {
      1: [
        { activity: 'National Academic Decathlon champion', scoreRange: [9, 10], context: 'Top team nationally in 10-event academic competition' },
        { activity: 'Congressional Award Gold Medal', scoreRange: [9, 10], context: 'Highest civilian award for youth; requires 400+ hours across categories' },
        { activity: 'National Merit Finalist', scoreRange: [8, 9], context: 'Top ~1% of PSAT takers; demonstrates strong academic foundation' },
      ],
      2: [
        { activity: 'State Academic Decathlon medalist', scoreRange: [7, 8], context: 'Top individual scorer across 10 subjects at state level' },
        { activity: 'Tutoring program founder serving 50+ students', scoreRange: [7, 8], context: 'Created sustained educational initiative with measurable impact' },
        { activity: 'Quiz Bowl nationals qualifier', scoreRange: [7, 8], context: 'Top teams from state-level competition' },
      ],
      3: [
        { activity: 'NHS officer with active projects', scoreRange: [5, 6], context: 'Leadership role with tangible initiatives; distinguishes from passive membership' },
        { activity: 'Honor society member with tutoring hours', scoreRange: [4, 5], context: 'Standard involvement; quantify student outcomes' },
        { activity: 'Academic team member with regional awards', scoreRange: [5, 6], context: 'Regular competition participation with some recognition' },
      ],
      4: [
        { activity: 'NHS membership only', scoreRange: [1, 3], context: 'One of the most common resume-padding activities; membership alone is Tier 4' },
        { activity: 'Honor roll listing', scoreRange: [1, 2], context: 'Academic achievement, not an extracurricular activity' },
      ],
    },
  },

  religious_cultural: {
    label: 'Religious & Cultural Activities',
    keywords: ['religious', 'church', 'mosque', 'temple', 'synagogue', 'faith', 'cultural', 'heritage', 'tradition', 'interfaith', 'ministry'],
    tiers: {
      1: [
        { activity: 'Interfaith initiative with policy/institutional impact', scoreRange: [9, 10], context: 'Created lasting cross-community dialogue with measurable outcomes' },
        { activity: 'Founded cultural preservation project with national reach', scoreRange: [9, 10], context: 'Sustained effort preserving endangered cultural practices with documented impact' },
      ],
      2: [
        { activity: 'Youth group leader for 2+ years with programs created', scoreRange: [7, 8], context: 'Sustained spiritual leadership with tangible community programs' },
        { activity: 'Cultural education program founder', scoreRange: [7, 8], context: 'Created educational programs sharing cultural heritage with broader community' },
        { activity: 'Interfaith dialogue organizer (multi-event series)', scoreRange: [7, 8], context: 'Organized sustained cross-faith engagement beyond one-off events' },
      ],
      3: [
        { activity: 'Regular youth group participation + specific role', scoreRange: [4, 6], context: 'Active faith community involvement with defined responsibilities' },
        { activity: 'Cultural club officer', scoreRange: [4, 5], context: 'Leadership in cultural organization; needs specific achievements' },
        { activity: 'Sunday school / religious education teaching', scoreRange: [5, 6], context: 'Teaching role shows commitment; quantify students and duration' },
      ],
      4: [
        { activity: 'Passive congregation membership', scoreRange: [1, 2], context: 'Attendance without active contribution or leadership' },
        { activity: 'One-time cultural event participation', scoreRange: [1, 2], context: 'Single event without sustained engagement' },
      ],
    },
  },

  international: {
    label: 'International Experience',
    keywords: ['exchange', 'international', 'study abroad', 'cultural exchange', 'rotary', 'afs', 'nsli-y', 'language immersion', 'global'],
    tiers: {
      1: [
        { activity: 'Competitive exchange with project outcomes (NSLI-Y, YES)', scoreRange: [9, 10], context: 'Highly selective government-sponsored exchange with language/cultural deliverables' },
        { activity: 'International competition representative', scoreRange: [9, 10], context: 'Representing country in academic/cultural competition abroad' },
      ],
      2: [
        { activity: 'AFS/Rotary year-long exchange program', scoreRange: [7, 8], context: 'Full academic year immersion in another culture; significant maturity signal' },
        { activity: 'Language immersion program with certification', scoreRange: [7, 8], context: 'Intensive language study with measurable proficiency outcomes' },
        { activity: 'International service project with sustained impact', scoreRange: [7, 8], context: 'Meaningful contribution abroad beyond voluntourism' },
      ],
      3: [
        { activity: 'Short-term cultural exchange (2-4 weeks)', scoreRange: [4, 6], context: 'Brief but structured international experience; value depends on engagement' },
        { activity: 'School-organized international trip with project', scoreRange: [4, 5], context: 'Group travel with academic component; distinguish personal contribution' },
        { activity: 'Language study abroad (summer)', scoreRange: [4, 5], context: 'Summer language immersion; common among applicants to selective schools' },
      ],
      4: [
        { activity: 'Family vacation reframed as cultural experience', scoreRange: [1, 2], context: 'Travel without structured learning or service component' },
        { activity: 'Tourist trip listed as international experience', scoreRange: [1, 2], context: 'No academic, service, or cultural immersion component' },
      ],
    },
  },

  media_digital: {
    label: 'Media & Digital Content',
    keywords: ['youtube', 'podcast', 'social media', 'content creation', 'blog', 'streaming', 'video', 'digital media', 'influencer', 'tiktok', 'instagram'],
    tiers: {
      1: [
        { activity: '100K+ audience across platforms with consistent content', scoreRange: [9, 10], context: 'Building large audience requires content strategy, consistency, and real engagement' },
        { activity: 'National media award or recognition', scoreRange: [9, 10], context: 'External validation of content quality at national level' },
      ],
      2: [
        { activity: '10K+ followers with consistent, quality content', scoreRange: [7, 8], context: 'Meaningful audience built through sustained effort and content quality' },
        { activity: 'School media production lead (TV/radio/podcast)', scoreRange: [7, 8], context: 'Leading school media production with regular output' },
        { activity: 'Monetized content creation with real revenue', scoreRange: [7, 8], context: 'Revenue validates audience engagement beyond vanity metrics' },
      ],
      3: [
        { activity: 'School media club active member', scoreRange: [4, 6], context: 'Regular contribution to school media productions' },
        { activity: 'Personal content creation with small but engaged audience', scoreRange: [4, 5], context: 'Consistent output shows dedication; distinguish by quality and engagement' },
        { activity: 'Podcast/YouTube with 20+ episodes', scoreRange: [5, 6], context: 'Sustained content production shows commitment to craft' },
      ],
      4: [
        { activity: 'Personal social media account', scoreRange: [1, 2], context: 'Having social media isn\'t an extracurricular activity' },
        { activity: 'Single video/post that went viral', scoreRange: [1, 2], context: 'One-time virality without sustained content creation' },
      ],
    },
  },
};

// ============================================================================
// LOOKUP FUNCTIONS
// ============================================================================

/**
 * Find the best matching category for an activity based on its title, type, and description.
 * Returns the category key and match quality.
 */
export function matchActivityToCategory(
  title: string,
  type?: string,
  description?: string
): { category: string; confidence: 'high' | 'medium' | 'low' } {
  const searchText = `${title} ${type || ''} ${description || ''}`.toLowerCase();

  let bestMatch = '';
  let bestScore = 0;

  for (const [key, cat] of Object.entries(BENCHMARKS_BY_CATEGORY)) {
    let score = 0;
    for (const keyword of cat.keywords) {
      if (searchText.includes(keyword.toLowerCase())) {
        score += keyword.length; // Longer keyword matches are more specific
      }
    }
    if (score > bestScore) {
      bestScore = score;
      bestMatch = key;
    }
  }

  if (!bestMatch) {
    return { category: 'leadership_government', confidence: 'low' };
  }

  const confidence = bestScore >= 12 ? 'high' : bestScore >= 5 ? 'medium' : 'low';
  return { category: bestMatch, confidence };
}

/**
 * Get benchmarks for a specific category and tier.
 * Returns the tier's benchmarks plus adjacent tiers for "above" and "below" context.
 */
export function getBenchmarksForActivity(
  category: string,
  tier: 1 | 2 | 3 | 4
): {
  current: BenchmarkEntry[];
  above: BenchmarkEntry[];
  below: BenchmarkEntry[];
} {
  const cat = BENCHMARKS_BY_CATEGORY[category];
  if (!cat) {
    return { current: [], above: [], below: [] };
  }

  return {
    current: cat.tiers[tier] || [],
    above: tier > 1 ? (cat.tiers[(tier - 1) as 1 | 2 | 3 | 4] || []) : [],
    below: tier < 4 ? (cat.tiers[(tier + 1) as 1 | 2 | 3 | 4] || []) : [],
  };
}

/**
 * Format benchmarks as a compact string for injection into scoring prompts.
 * Only includes the relevant category, keeping token usage minimal.
 */
export function formatBenchmarksForPrompt(
  title: string,
  type?: string,
  description?: string
): string {
  const { category, confidence } = matchActivityToCategory(title, type, description);
  const cat = BENCHMARKS_BY_CATEGORY[category];

  if (!cat || confidence === 'low') {
    return ''; // Don't inject low-confidence benchmarks; let LLM use its own knowledge
  }

  const lines: string[] = [];
  lines.push(`\nCOMPARISON BENCHMARKS (${cat.label}):`);

  for (const tierNum of [1, 2, 3, 4] as const) {
    const tierLabel = tierNum === 1 ? 'Tier 1 (9-10)' : tierNum === 2 ? 'Tier 2 (7-8)' : tierNum === 3 ? 'Tier 3 (4-6)' : 'Tier 4 (1-3)';
    const entries = cat.tiers[tierNum];
    const examples = entries.slice(0, 3).map(e => `${e.activity} [${e.scoreRange[0]}-${e.scoreRange[1]}]: ${e.context}`);
    lines.push(`${tierLabel}: ${examples.join(' | ')}`);
  }

  lines.push('Use these benchmarks to calibrate your scoring and populate comparisonBenchmarks fields.');
  return lines.join('\n');
}

/**
 * Format benchmarks for a batch of activities (one section per activity).
 * Only includes categories that are actually relevant, avoiding redundant data.
 */
export function formatBatchBenchmarksForPrompt(
  activities: Array<{ title: string; type?: string; description?: string }>
): string {
  // Deduplicate categories
  const categoriesUsed = new Map<string, string[]>();

  for (const act of activities) {
    const { category, confidence } = matchActivityToCategory(act.title, act.type, act.description);
    if (confidence !== 'low') {
      const existing = categoriesUsed.get(category) || [];
      existing.push(act.title);
      categoriesUsed.set(category, existing);
    }
  }

  if (categoriesUsed.size === 0) return '';

  const lines: string[] = [];
  lines.push('\n--- COMPARISON BENCHMARKS LIBRARY ---');
  lines.push('Use these pre-researched benchmarks to calibrate scoring and populate comparisonBenchmarks fields.\n');

  for (const [catKey, activityTitles] of categoriesUsed) {
    const cat = BENCHMARKS_BY_CATEGORY[catKey];
    if (!cat) continue;

    lines.push(`[${cat.label}] (for: ${activityTitles.join(', ')})`);
    for (const tierNum of [1, 2, 3, 4] as const) {
      const entries = cat.tiers[tierNum];
      const examples = entries.slice(0, 3).map(e => `• ${e.activity} [${e.scoreRange[0]}-${e.scoreRange[1]}]: ${e.context}`);
      lines.push(`  Tier ${tierNum}: ${examples.join(' | ')}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
