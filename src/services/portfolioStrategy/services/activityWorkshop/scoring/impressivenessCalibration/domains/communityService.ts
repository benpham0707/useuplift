/**
 * Community Service Impressiveness Domain
 *
 * Evaluates volunteering, nonprofit work, and civic engagement.
 * AOs are highly calibrated on service activities because they see thousands
 * of them. The bar for differentiation is high — most applicants list some
 * volunteering. What separates tiers is the progression from participating
 * to creating systemic change.
 *
 * Key insight: AOs can immediately distinguish "did it for the app" from
 * genuine commitment. Sustained engagement, measurable outcomes, and
 * founder-level initiative are the primary differentiators.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const COMMUNITY_SERVICE_LADDER: ImpressionEntry[] = [
  {
    level: 'baseline',
    description: 'Occasional or school-required volunteering: soup kitchen shifts, food drives, park cleanups. Often listed as "100 hours" with no specific outcomes or sustained commitment.',
    whyImpressive: 'AOs see this from 60-70% of applicants. Required service hours or sporadic volunteering does not differentiate. The activity itself signals nothing about the student.',
    prevalence: '60-70% of selective-school applicants list some community service',
    applicantPercentile: 'Bottom 50% of service activities',
    verificationMarkers: ['organization name', 'approximate total hours', 'general time period'],
    differentiatorFromBelow: 'Any volunteering is better than none, but the bar is extremely low for selective admissions',
    differentiatorFromAbove: 'Missing: sustained commitment over multiple seasons, specific role, measurable outcomes, and evidence of personal investment in the cause',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description: 'Sustained volunteering (100+ hours, 1+ years) at a specific organization with a defined role. Regular weekly commitment showing reliability. May have taken on coordination duties.',
    whyImpressive: 'Consistency over time demonstrates genuine commitment rather than resume-padding. AOs value the student who returns every Saturday for two years over the one who logs 100 hours in a summer.',
    prevalence: '20-25% of applicants maintain sustained service commitments',
    applicantPercentile: 'Top 25-35% of service activities',
    verificationMarkers: ['specific weekly schedule', 'named supervisor or coordinator', 'defined role (not just volunteer)', 'multi-year timeline', 'specific population served'],
    differentiatorFromBelow: 'Consistency and defined role — this student has a real relationship with an organization, not just a time stamp',
    differentiatorFromAbove: 'Still operating within existing structures. Has not created something new, and impact is not yet measurable beyond personal contribution.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description: 'Founded or significantly expanded a service initiative: 500+ hours, launched a new program, recruited and managed other volunteers, created measurable community impact (people served, funds raised, policy changed).',
    whyImpressive: 'Moving from volunteer to founder/organizer requires entirely different skills — project management, recruitment, fundraising, strategic planning. The initiative itself becomes the student\u2019s creation.',
    prevalence: '5-8% of applicants have founded or led significant service initiatives',
    applicantPercentile: 'Top 8-12% of service activities',
    verificationMarkers: ['founding date and story', 'number of volunteers recruited', 'quantified impact (people served, meals delivered, funds raised)', 'partnership with established organization', 'media coverage or official recognition', 'sustainable operating model'],
    differentiatorFromBelow: 'Created something new rather than participating in something existing. Impact is measurable and extends beyond personal effort.',
    differentiatorFromAbove: 'Initiative is local in scope — has not yet achieved institutional partnerships, policy change, or scale beyond the immediate community.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description: 'Scaled organization to multi-chapter or regional operation, secured partnerships with established NGOs or government agencies, influenced local policy, received significant grants ($5K+), or earned state-level recognition.',
    whyImpressive: 'This student has built something that outlasts them. Institutional partnerships, grant funding, and policy influence demonstrate that adults in positions of authority took this teenager seriously enough to allocate real resources.',
    prevalence: '1-2% of applicants build service organizations with institutional recognition',
    applicantPercentile: 'Top 2-3% of service activities',
    verificationMarkers: ['501(c)(3) incorporation', 'grant award documentation', 'formal partnership agreements', 'government meeting minutes or policy documents', 'state-level award', 'news coverage in regional outlets', 'auditable financial records'],
    differentiatorFromBelow: 'External institutional validation — grants, partnerships, policy change. The work has been vetted and deemed credible by organizations with reputations to protect.',
    differentiatorFromAbove: 'Impact is regional, not national. Has not achieved systemic change beyond the local/state level or earned top-tier national recognition.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description: 'National recognition (Congressional Award Gold Medal, Presidential Volunteer Service Award Gold, national media feature), systemic policy change, or organization scaled to national impact with demonstrated sustainability.',
    whyImpressive: 'This is in the top fraction of a percent of all applicants nationally. AOs at HYP/Stanford see perhaps 5-10 service activities at this level per cycle. The student has created measurable, documented change at a systemic level.',
    prevalence: '<0.5% of applicants achieve national-level service impact',
    applicantPercentile: 'Top 0.5% of service activities',
    verificationMarkers: ['Congressional Award or equivalent documentation', 'national media coverage (NYT, NPR, CNN)', 'measurable systemic outcome (lives changed, policy adopted, legislation influenced)', 'organization operating independently', 'invited speaker at national conferences'],
    differentiatorFromBelow: 'Impact is systemic and nationally recognized. This is not impressive-for-a-teenager — it is impressive by any standard.',
    differentiatorFromAbove: 'N/A — this is the highest level',
    tierRange: [1],
  },
];

const COMMUNITY_SERVICE_MARKERS: TechnicalDepthMarker[] = [
  {
    term: 'Total volunteer hours',
    meaning: 'Cumulative hours served is a basic measure of commitment depth',
    hsContext: '50-100 hours is typical for required service. 200+ shows genuine commitment. 500+ is rare and signals deep personal investment. 1000+ is extraordinary and should be verified.',
    indicatesLevel: 'notable',
    detectionKeywords: ['hours', 'volunteer hours', 'service hours', 'total hours', 'hours of service'],
    detectionConfidence: 'high',
  },
  {
    term: 'People served',
    meaning: 'Quantified reach of the service activity — how many community members were directly impacted',
    hsContext: 'Most HS volunteers serve 20-50 people per event. Serving 200+ regularly suggests organizational-level impact. 1000+ suggests a scaled program.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['people served', 'community members', 'families helped', 'students tutored', 'meals served', 'individuals impacted'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Organization founded',
    meaning: 'Creating a new service initiative from scratch demonstrates entrepreneurial social impact',
    hsContext: 'HS students who found genuine organizations (not just "clubs") show exceptional initiative. AOs distinguish between a school club and an externally-operating nonprofit.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['founded', 'co-founded', 'established', 'created', 'launched', 'started'],
    detectionConfidence: 'high',
  },
  {
    term: '501(c)(3) status',
    meaning: 'IRS tax-exempt nonprofit designation requires legal filing, bylaws, and board of directors',
    hsContext: 'Extremely rare for HS students. Indicates the student navigated legal/bureaucratic processes that most adults find challenging. Strong verification marker.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['501(c)(3)', 'nonprofit', 'non-profit', 'tax-exempt', 'incorporated', 'registered charity'],
    detectionConfidence: 'high',
  },
  {
    term: 'Grant received',
    meaning: 'Competitive funding from foundations, government, or institutions validates the initiative\'s credibility',
    hsContext: 'Grant applications require proposals, budgets, and outcome metrics. Receiving a grant means adult evaluators deemed this student\'s work fundable. Even small grants ($500+) are significant.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['grant', 'funded by', 'awarded funding', 'grant recipient', 'fellowship', 'seed funding'],
    detectionConfidence: 'high',
  },
  {
    term: 'Media coverage',
    meaning: 'News coverage by legitimate outlets indicates external validation and community impact',
    hsContext: 'Local newspaper coverage is meaningful but common for "feel-good" HS stories. Regional/national coverage signals genuinely newsworthy impact.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['featured in', 'covered by', 'news', 'article', 'interview', 'media', 'newspaper', 'TV segment'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Partnership established',
    meaning: 'Formal partnership with an established organization demonstrates credibility and scale',
    hsContext: 'When a real NGO, hospital, or government agency partners with a HS student\'s initiative, it validates the work. AOs weight this heavily because it means adults vetted the student.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['partnered with', 'partnership', 'collaborated with', 'in collaboration', 'working with', 'sponsored by'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Measurable outcome metric',
    meaning: 'Specific, quantified results that demonstrate the tangible impact of the service work',
    hsContext: 'Most HS volunteers cannot articulate specific outcomes. Stating "raised $15,000 for clean water, providing access to 3 villages" is exponentially more compelling than "helped the community."',
    indicatesLevel: 'impressive',
    detectionKeywords: ['raised $', 'collected', 'distributed', 'reduced by', 'increased by', 'improved', 'resulting in', 'leading to', 'provided'],
    detectionConfidence: 'medium',
  },
];

export const COMMUNITY_SERVICE_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'community_service',
  label: 'Community Service & Volunteering',
  overview: 'Community service is the most saturated activity category in selective admissions — nearly every applicant lists something. This means the bar for differentiation is extremely high. AOs instantly calibrate between "did it for the app" (occasional volunteering, required hours) and genuine commitment (sustained engagement, founded initiatives, measurable impact). The progression that matters: participating → leading → creating → scaling → transforming. Each step represents a fundamentally different level of initiative and impact.',
  ladder: COMMUNITY_SERVICE_LADDER,
  technicalDepthMarkers: COMMUNITY_SERVICE_MARKERS,
};
