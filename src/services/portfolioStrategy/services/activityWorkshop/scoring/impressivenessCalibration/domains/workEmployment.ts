/**
 * Work & Employment Impressiveness Domain
 *
 * Evaluates paid employment, internships, and professional experiences.
 * AOs value work experience differently than other activities — sustained
 * employment while maintaining academics signals maturity and time management,
 * while significant responsibility/impact signals exceptional professional aptitude.
 *
 * Key insight: AOs at selective schools see relatively few strong work entries
 * because affluent applicants rarely hold jobs. A compelling work narrative
 * with real responsibility can be a genuine differentiator.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const WORK_EMPLOYMENT_LADDER: ImpressionEntry[] = [
  {
    level: 'baseline',
    description: 'Seasonal, part-time, or entry-level employment (fast food, retail cashier, lifeguard) with minimal responsibility beyond assigned tasks.',
    whyImpressive: 'Shows willingness to work, but AOs see this from ~30% of applicants at selective schools. The experience itself does not differentiate.',
    prevalence: '30-40% of applicants at selective schools have held some job',
    applicantPercentile: 'Bottom 50% of work-related activities',
    verificationMarkers: ['employer name', 'dates of employment', 'hours per week'],
    differentiatorFromBelow: 'Having any paid job at all shows basic initiative versus no work experience',
    differentiatorFromAbove: 'Missing: sustained commitment, growth within the role, or measurable contribution beyond basic duties',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description: 'Sustained employment (6+ months) while maintaining strong academics, with evidence of increased responsibility such as training new employees or earning a promotion.',
    whyImpressive: 'Balancing 15+ hours/week of work with rigorous coursework demonstrates time management and maturity. A promotion shows the employer values this student above peers.',
    prevalence: '15-20% of selective-school applicants sustain employment through the school year',
    applicantPercentile: 'Top 30-40% of work activities',
    verificationMarkers: ['promotion timeline', 'hours/week during school year', 'training responsibilities', 'employer reference available'],
    differentiatorFromBelow: 'Sustained commitment and demonstrable growth within the role, not just showing up',
    differentiatorFromAbove: 'Has not yet taken on significant operational responsibility — still executing within existing systems, not shaping them',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description: 'Significant operational responsibility: managing a team of 3+, handling a budget, running a department during shifts, or completing a technical internship at a recognized company.',
    whyImpressive: 'At 16-17, managing other employees or handling real P&L demonstrates professional maturity that most adults struggle with. Technical internships show industry-validated skills.',
    prevalence: '5-8% of applicants have management-level work experience',
    applicantPercentile: 'Top 10-15% of work activities',
    verificationMarkers: ['number of direct reports', 'budget responsibility amount', 'internship offer letter', 'supervisor title and contact', 'performance review excerpts'],
    differentiatorFromBelow: 'Moved from executing tasks to owning outcomes — responsible for other people or measurable business results',
    differentiatorFromAbove: 'Impact is localized to one team or shift; has not yet influenced company-wide operations or been recognized outside the organization',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description: 'Department manager or senior role at a real company, published industry work, or competitive internship at a top firm (FAANG, Fortune 500, research lab). Earned industry certifications or professional recognition.',
    whyImpressive: 'Competing against adults for these roles and succeeding signals that this student operates at a professional level that most college graduates aspire to.',
    prevalence: '1-2% of HS students hold professional-level roles with external recognition',
    applicantPercentile: 'Top 2-3% of work activities',
    verificationMarkers: ['industry certification', 'professional publication credit', 'LinkedIn-verifiable role', 'named in company communications', 'industry award'],
    differentiatorFromBelow: 'External validation from the industry — not just doing well at a job, but being recognized as exceptional within a professional field',
    differentiatorFromAbove: 'Role is within an existing organization. Has not created systemic change or built something from the ground up that transforms operations.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description: 'C-suite-equivalent impact: founded a division/product line, managed $100K+ budgets, led transformative operational changes, or held a role normally reserved for experienced professionals (e.g., CTO of a startup, published researcher at a company).',
    whyImpressive: 'This is not "impressive for a high schooler" — this is impressive by any professional standard. AOs recognize that this student has already demonstrated capabilities that differentiate them from most college graduates.',
    prevalence: '<0.1% of HS applicants achieve this level of professional impact',
    applicantPercentile: 'Top 0.1% of work activities',
    verificationMarkers: ['revenue/budget figures', 'media coverage of work', 'patent or intellectual property', 'board-level reference', 'quantified business impact'],
    differentiatorFromBelow: 'Created or transformed something at a systemic level. This is not working within an organization — this is changing how the organization works.',
    differentiatorFromAbove: 'N/A — this is the highest level',
    tierRange: [1],
  },
];

const WORK_EMPLOYMENT_MARKERS: TechnicalDepthMarker[] = [
  {
    term: 'Hours/week during school',
    meaning: 'Working 15-20+ hours/week during the academic year demonstrates significant time management',
    hsContext: 'Most HS workers do 5-10 hrs/week. 15+ during school year while maintaining GPA is genuinely impressive. 25+ raises concern about overcommitment.',
    indicatesLevel: 'notable',
    detectionKeywords: ['hours per week', 'hrs/week', 'hours/week', 'during school year', 'while maintaining'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Promotion',
    meaning: 'Being promoted within a role shows employer recognition of above-average performance',
    hsContext: 'HS students rarely get promoted — most seasonal jobs do not have promotion tracks. A genuine promotion (not just a title change) signals that the employer invested in this student.',
    indicatesLevel: 'notable',
    detectionKeywords: ['promoted', 'promotion', 'advanced to', 'moved up to', 'elevated to'],
    detectionConfidence: 'high',
  },
  {
    term: 'People managed',
    meaning: 'Direct supervision of other employees demonstrates leadership in a professional context',
    hsContext: 'Managing even 2-3 employees at age 16-17 is rare. Most HS managers supervise peers in food service or retail — still meaningful for demonstrating accountability.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['managed', 'supervised', 'oversaw', 'direct reports', 'team of', 'trained and managed'],
    detectionConfidence: 'high',
  },
  {
    term: 'Revenue responsibility',
    meaning: 'Being accountable for revenue targets or business outcomes beyond personal tasks',
    hsContext: 'AOs see this primarily from family business or entrepreneurial contexts. Genuine P&L responsibility at a non-family business is exceptional.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['revenue', 'sales', 'P&L', 'profit', 'generated $', 'responsible for $'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Industry certification',
    meaning: 'Professional certifications (ServSafe Manager, AWS Cloud, Google Analytics) that require study and examination',
    hsContext: 'Most HS students do not pursue professional certifications. Having one signals seriousness about the field and willingness to invest in professional development.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['certified', 'certification', 'licensed', 'credential', 'accredited'],
    detectionConfidence: 'high',
  },
  {
    term: 'Professional reference',
    meaning: 'A supervisor willing to provide a recommendation speaks to genuine impact and relationship building',
    hsContext: 'Most HS jobs end without lasting professional relationships. A strong reference from a non-family supervisor validates the claimed experience.',
    indicatesLevel: 'notable',
    detectionKeywords: ['reference', 'recommendation', 'supervisor endorsement'],
    detectionConfidence: 'low',
  },
  {
    term: 'Performance review',
    meaning: 'Formal evaluation by employer documenting strengths and contributions',
    hsContext: 'Very few HS students undergo formal performance reviews. Having documented positive evaluations provides concrete evidence of professional impact.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['performance review', 'evaluation', 'annual review', 'quarterly review', 'rated'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Budget managed',
    meaning: 'Being entrusted with financial resources demonstrates significant organizational trust',
    hsContext: 'Budget responsibility is almost unheard of for HS students outside family businesses. Managing $1K+ shows the employer trusts this student with real assets.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['budget', 'managed $', 'allocated', 'financial responsibility', 'controlled spending'],
    detectionConfidence: 'medium',
  },
];

export const WORK_EMPLOYMENT_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'work_employment',
  label: 'Work & Employment',
  overview: 'Paid employment is underrepresented in selective admissions because affluent applicants rarely hold jobs. AOs recognize this context — a strong work narrative with real responsibility, sustained commitment, and professional growth can be a genuine differentiator, especially for first-gen and lower-income applicants. The key question is not whether the student worked, but what they did with the opportunity: Did they grow? Did they take on responsibility? Did they create impact beyond their assigned role?',
  ladder: WORK_EMPLOYMENT_LADDER,
  technicalDepthMarkers: WORK_EMPLOYMENT_MARKERS,
};
