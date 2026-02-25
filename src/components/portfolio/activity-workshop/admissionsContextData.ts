/**
 * admissionsContextData.ts — Static admissions context for hover cards.
 *
 * This data was extracted from the backend knowledge base
 * (expertCounselorKnowledgeBase.ts) to be displayed in the UI on demand,
 * rather than repeated in every LLM-generated finding.
 *
 * Source: Sara Harberson 4-tier framework, AO reading research
 */

// ============================================================================
// TIER DEFINITIONS
// ============================================================================

export interface TierDefinition {
  tier: 1 | 2 | 3 | 4;
  name: string;
  label: string;
  definition: string;
  evidence: string[];
  examples: string[];
  admissionImpact: string;
}

export const TIER_DEFINITIONS: Record<1 | 2 | 3 | 4, TierDefinition> = {
  1: {
    tier: 1,
    name: 'Elite',
    label: 'T1 Elite',
    definition: 'National or international distinction in your field. Top ~1% of high school students in this activity area.',
    evidence: [
      'National/international awards or recognition',
      'Published research or creative work with external validation',
      'Leadership of organizations with significant reach (1000+)',
      'Measurable impact beyond your immediate community',
    ],
    examples: [
      'Intel ISEF finalist or national science olympiad medalist',
      'Published in peer-reviewed journal or major publication',
      'Founded nonprofit serving 1000+ beneficiaries',
      'Recruited athlete at D1 level',
    ],
    admissionImpact: '4x admission boost — significantly differentiates your application',
  },
  2: {
    tier: 2,
    name: 'Strong',
    label: 'T2 Strong',
    definition: 'State or regional recognition with impact extending beyond your school. Top ~5-10% of applicants.',
    evidence: [
      'State-level competition placement or awards',
      'Regional leadership roles with measurable outcomes',
      'Sustained commitment (2+ years) with clear progression',
      'Impact numbers that demonstrate real scope (100+)',
    ],
    examples: [
      'State science fair top-10 or DECA state qualifier',
      'Captain of varsity team that won conference/regionals',
      'Founded school organization that grew to 50+ members',
      'Research project presented at regional conference',
    ],
    admissionImpact: '2.5x admission boost — meaningfully strengthens your application',
  },
  3: {
    tier: 3,
    name: 'Solid',
    label: 'T3 Solid',
    definition: 'School-level leadership and contribution with clear personal growth. This is where most strong applicants fall.',
    evidence: [
      'School leadership role (officer, captain, section leader)',
      'Consistent multi-year commitment showing progression',
      'Some measurable contribution to the group or community',
      'Skills development visible in the description',
    ],
    examples: [
      'Club president or VP with specific initiatives',
      'Varsity athlete with 3+ years commitment',
      'Volunteer tutor with regular schedule and tracked results',
      'Student government representative who led specific projects',
    ],
    admissionImpact: '1.5x — positive contribution, but needs other strong activities to stand out',
  },
  4: {
    tier: 4,
    name: 'Basic',
    label: 'T4 Basic',
    definition: 'General participation without distinctive leadership, recognition, or measurable impact.',
    evidence: [
      'Member-level involvement',
      'Short-term or inconsistent participation',
      'No specific role or leadership described',
      'Impact is vague or unmeasurable',
    ],
    examples: [
      'Club member without officer role or specific project',
      'One-time volunteer event',
      'Participation without competitive results',
      'Hobby listed without external validation',
    ],
    admissionImpact: 'Minimal — fills space but doesn\'t differentiate',
  },
};

// ============================================================================
// AO READING PROCESS
// ============================================================================

export interface AOProcessTopic {
  title: string;
  summary: string;
  details: string[];
}

export const AO_READING_PROCESS: Record<string, AOProcessTopic> = {
  'reading-speed': {
    title: 'How Officers Read Activities',
    summary: 'Admissions officers spend 6-8 seconds scanning each activity entry during an 8-minute application review.',
    details: [
      'The first phrase of your description sets the entire frame',
      'Officers scan for: leadership verbs, specific numbers, and unique details',
      'Generic language ("helped with", "participated in") triggers skip-over behavior',
      'Specific language ("Built", "Organized 12", "Increased by 40%") makes them slow down',
    ],
  },
  'agency-detection': {
    title: 'Agency Detection',
    summary: 'Officers use a mental shortcut to classify students as "drivers" (who led the work) or "participants" (who assisted).',
    details: [
      'Opening with someone else\'s name/title ("Worked with professor") = participant frame',
      'Opening with an action verb ("Built", "Designed", "Founded") = driver frame',
      'This categorization happens in the first 2-3 words and is hard to undo',
      'Same achievement, different framing = dramatically different impression',
    ],
  },
  'committee-pitch': {
    title: 'The Committee Pitch',
    summary: 'Your admissions officer must pitch your application to a committee in ~90 seconds. Every activity description gives them ammunition (or not).',
    details: [
      'The officer needs: one compelling hook, supporting evidence, school fit',
      'Vague descriptions give them nothing to pitch with',
      'Specific numbers and outcomes become talking points',
      'Your description is essentially writing the pitch for them',
    ],
  },
  'specificity-signal': {
    title: 'Specificity as Competency Signal',
    summary: 'Technical vocabulary and precise numbers signal genuine expertise. Vague language signals surface-level involvement.',
    details: [
      '"Data pipeline" could mean anything — "Python/pandas pipeline" places you immediately',
      '"50,000" reads like a layperson; "50K" reads like someone in the field',
      'Using field-specific abbreviations signals fluency (J. Health Informatics, not "a journal")',
      'AOs at technical schools explicitly look for this technical fluency',
    ],
  },
};

// ============================================================================
// SCHOOL ARCHETYPES
// ============================================================================

export interface SchoolArchetype {
  id: string;
  name: string;
  schools: string[];
  primaryValue: string;
  idealSpike: string;
  descriptionAdvice: string;
}

export const SCHOOL_ARCHETYPES: Record<string, SchoolArchetype> = {
  tech_innovator: {
    id: 'tech_innovator',
    name: 'Technical Innovator',
    schools: ['MIT', 'Caltech', 'Carnegie Mellon', 'Georgia Tech', 'Harvey Mudd'],
    primaryValue: 'Technical depth and genuine building',
    idealSpike: 'Maker/builder identity',
    descriptionAdvice: 'Lead with WHAT YOU BUILT, then HOW IT WORKS, then WHO USES IT.',
  },
  intellectual_leader: {
    id: 'intellectual_leader',
    name: 'Intellectual Leader',
    schools: ['Harvard', 'Princeton', 'Yale', 'Columbia', 'UPenn', 'Dartmouth', 'Brown'],
    primaryValue: 'Leadership that creates tangible community impact',
    idealSpike: 'Change agent identity',
    descriptionAdvice: 'Lead with IMPACT ON OTHERS, then YOUR ROLE, then SCALE.',
  },
  creative_innovator: {
    id: 'creative_innovator',
    name: 'Creative Innovator',
    schools: ['Stanford', 'Penn (Wharton)', 'Babson', 'USC', 'Northwestern'],
    primaryValue: 'Initiative, entrepreneurial mindset, impact at scale',
    idealSpike: 'Builder-innovator identity',
    descriptionAdvice: 'Lead with TRACTION AND SCALE, then INNOVATION, then VISION.',
  },
  intellectual_citizen: {
    id: 'intellectual_citizen',
    name: 'Intellectual Citizen',
    schools: ['Williams', 'Amherst', 'Swarthmore', 'Pomona', 'Bowdoin', 'Middlebury'],
    primaryValue: 'Deep engagement with ideas across disciplines',
    idealSpike: 'Intellectual citizen identity',
    descriptionAdvice: 'Show the THINKING behind the doing. Intellectual curiosity > raw scale.',
  },
  public_servant: {
    id: 'public_servant',
    name: 'Public Servant',
    schools: ['UVA', 'Michigan', 'UC Berkeley', 'UCLA', 'UNC', 'Georgetown'],
    primaryValue: 'Service to community with measurable outcomes',
    idealSpike: 'Engaged citizen identity',
    descriptionAdvice: 'Lead with COMMUNITY IMPACT, then YOUR ROLE, then SUSTAINABILITY.',
  },
};
