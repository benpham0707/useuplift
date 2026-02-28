/**
 * Entrepreneurship & Business — Impressiveness Calibration
 *
 * Covers: Startups, small businesses, freelancing, social enterprises,
 * business competitions (DECA, FBLA, BPA), e-commerce, app development
 * with commercial intent.
 *
 * Key insight for AOs: Entrepreneurship is one of the easiest activities
 * to inflate ("CEO of my startup"). The differentiator is EVIDENCE of
 * traction: revenue, customers, employees, external funding, or
 * competition placement. A "startup" with no users is a class project.
 */

import type { ImpressivenessDomain, ImpressionEntry, TechnicalDepthMarker } from '../types';

const ladder: ImpressionEntry[] = [
  {
    level: 'baseline',
    description:
      'Has a business idea, business plan, or early-stage project. May have built a website or prototype. Participated in a school entrepreneurship club or business class project. Listed as "Founder" or "CEO" of a venture with no external validation.',
    whyImpressive:
      'Not a differentiator — and can actually hurt if presented as more than it is. AOs have developed strong skepticism toward self-proclaimed "CEO" and "Founder" titles from HS students. Without evidence of real customers, revenue, or external validation, this reads as resume inflation. Showing initiative is fine, but claiming a leadership title for a class project signals a lack of self-awareness.',
    prevalence: 'Very common — "Founder of [startup name]" appears on a large and growing fraction of applications.',
    applicantPercentile: 'Top 50-70%',
    verificationMarkers: [
      'Described specific product or service (not just "a startup")',
      'Named the problem being solved',
      'Mentioned specific tools or technologies used to build it',
      'Honest about stage (planning, prototype, launched)',
    ],
    differentiatorFromBelow: 'At least took initiative to conceptualize and plan a business, even if not launched.',
    differentiatorFromAbove: 'No external validation: no real users, no revenue, no competition recognition, no customers beyond friends/family.',
    tierRange: [5, 6],
  },
  {
    level: 'notable',
    description:
      'Launched a real product or service with actual users/customers beyond friends and family. Has a functional website/app/storefront. May have generated some revenue ($100-$1K). Active in business competitions (DECA chapter, FBLA state qualifier). Freelancing with repeat clients.',
    whyImpressive:
      'AOs recognize the gap between "had an idea" and "shipped a product that people use." Actually launching — dealing with customers, handling logistics, iterating based on feedback — demonstrates follow-through and real-world problem-solving that classroom activities can\'t replicate. DECA/FBLA state qualification shows competitive business knowledge. This is where entrepreneurship starts to become a real differentiator.',
    prevalence: 'Moderately common among business-oriented applicants — about 1 in 10 "founder" claims have verifiable traction.',
    applicantPercentile: 'Top 20-35%',
    verificationMarkers: [
      'Named product/service with describable user base',
      'Specific user or customer count (even small, e.g., "47 customers")',
      'Revenue figure (even modest)',
      'DECA/FBLA/BPA competition results with event name',
      'Testimonials or repeat customers',
      'Functional website/app URL implied or described',
      'Specific challenge overcome (manufacturing, shipping, marketing)',
    ],
    differentiatorFromBelow: 'Real product in the hands of real users vs. idea/prototype stage. Some external validation.',
    differentiatorFromAbove: 'Small-scale operation. Revenue is modest. No significant growth trajectory or external recognition beyond school.',
    tierRange: [4],
  },
  {
    level: 'impressive',
    description:
      'Revenue-generating business with meaningful scale: 100+ customers or $1K-$10K revenue. Won or placed at state or regional business competitions (DECA State, Diamond Challenge semifinalist, Conrad Challenge). Product has demonstrable market fit — repeat purchases, growing user base, or positive reviews. May have hired contractors or part-time help.',
    whyImpressive:
      'Breaking the $1K revenue barrier or reaching 100+ customers proves that a real market exists for what this student built. DECA State or equivalent competition success adds expert validation. AOs see this as genuine entrepreneurial capability — not just initiative, but execution, iteration, and market awareness. This student has done something most adults never accomplish: created a product people voluntarily pay for.',
    prevalence: 'Uncommon — fewer than 5% of student "entrepreneurs" reach meaningful revenue.',
    applicantPercentile: 'Top 8-15%',
    verificationMarkers: [
      'Specific revenue figure ($1K+ with timeframe)',
      'Customer count with growth trajectory',
      'Competition placement with competition name and level',
      'Product reviews or press mentions',
      'Growth metrics (MoM growth, retention rate)',
      'Described hiring or delegating process',
      'Named the market and described competitive landscape',
    ],
    differentiatorFromBelow: 'Revenue scale, customer growth, and/or competitive validation at state level. Evidence of product-market fit.',
    differentiatorFromAbove: 'Significant revenue but not a "real" business by adult standards. No external funding, no employees, limited scale.',
    tierRange: [3],
  },
  {
    level: 'exceptional',
    description:
      'Business generating $10K+ revenue or securing external funding (grant, angel investment, incubator/accelerator acceptance). DECA ICDC (International) qualifier or winner. National competition finalist (Diamond Challenge, Conrad Innovation). Hired employees (not just friends). Product serving thousands of users. Social enterprise with measurable community impact.',
    whyImpressive:
      'At this level, the student has built something that would be impressive for an adult, let alone a teenager. $10K+ revenue means this isn\'t a hobby — it\'s a functioning business. External funding means professional investors evaluated this venture and decided to put money behind it. DECA ICDC qualification requires winning at state and regional levels. AOs recognize this as evidence of exceptional drive, business acumen, and execution ability. This student will contribute to campus entrepreneurship culture from day one.',
    prevalence: 'Rare — perhaps 500-1,000 HS students nationally generate $10K+ revenue or receive external funding per year.',
    applicantPercentile: 'Top 1-3%',
    verificationMarkers: [
      'Revenue figure ($10K+) with specific timeframe and context',
      'Funding source and amount (named investor, grant, accelerator)',
      'DECA ICDC or national competition results',
      'Employee count with described roles',
      'User/customer metrics in thousands',
      'Incorporation documents or business registration',
      'Press coverage with publication name',
      'Partnership or B2B clients',
    ],
    differentiatorFromBelow: 'Scale that proves real business viability. External funding or national competition validation. Employees and structure.',
    differentiatorFromAbove: 'Successful for a HS student but not yet a venture-scale business. Revenue is meaningful but not transformative.',
    tierRange: [2],
  },
  {
    level: 'extraordinary',
    description:
      'Business generating $100K+ revenue or significant venture funding ($50K+ from named investors). Accepted into Y Combinator, Thiel Fellowship, or equivalent tier accelerator. Multiple full-time employees. Acquisition offer or completed. Patent granted. Product used by tens of thousands. National media coverage.',
    whyImpressive:
      'This is no longer a student activity — it\'s a real company that happens to be founded by a teenager. Y Combinator accepts fewer than 2% of applicants (most of whom are adults with years of experience). $100K+ revenue places this student in the top fraction of ALL entrepreneurs, not just student ones. AOs at schools with strong entrepreneurship programs (Stanford, MIT, Wharton, Babson) will flag this as a standout application. This student may not even need college to succeed — which is exactly what makes them compelling.',
    prevalence: 'Extremely rare — perhaps 20-50 HS students nationally per year reach this level.',
    applicantPercentile: 'Top 0.05%',
    verificationMarkers: [
      'Revenue figure ($100K+) with verifiable context',
      'Named investors or funding round details',
      'Named accelerator acceptance (YC, Thiel, etc.)',
      'Employee headcount with roles',
      'Patent number or filing',
      'Acquisition offer or completion details',
      'National press coverage with publication names',
      'User metrics in tens of thousands or more',
    ],
    differentiatorFromBelow: 'Venture-scale business with institutional validation. Revenue and funding that exceed what most adult entrepreneurs achieve.',
    differentiatorFromAbove: 'This is the ceiling for HS entrepreneurship.',
    tierRange: [1],
  },
];

const technicalDepthMarkers: TechnicalDepthMarker[] = [
  {
    term: 'Revenue',
    meaning:
      'Actual money received from customers for products or services. Gross revenue (total sales) vs. net revenue (after refunds/returns) vs. profit (after costs). The specific figure and timeframe are what matter.',
    hsContext:
      'Revenue is the single most important verification marker for HS entrepreneurship. Any amount above $0 separates real from imaginary businesses. $1K+ shows traction; $10K+ shows real business; $100K+ is extraordinary.',
    indicatesLevel: 'notable',
    detectionKeywords: ['revenue', 'sales', 'earned', 'generated', 'gross revenue', 'net revenue', 'income', 'profit'],
    detectionConfidence: 'high',
  },
  {
    term: 'Customers / users',
    meaning:
      'People who have used or purchased the product/service. Distinct from page views or social media followers. Active users indicates ongoing engagement.',
    hsContext:
      'Customer count provides scale context. 10 customers is friends/family; 100+ shows real market; 1,000+ shows significant traction; 10,000+ is exceptional for any startup.',
    indicatesLevel: 'notable',
    detectionKeywords: ['customers', 'users', 'clients', 'subscribers', 'active users', 'downloads', 'sign-ups', 'paying customers'],
    detectionConfidence: 'medium',
  },
  {
    term: 'MRR (Monthly Recurring Revenue)',
    meaning:
      'The predictable, recurring revenue generated each month from subscriptions or ongoing services. MRR indicates a business model with retention, not just one-time sales.',
    hsContext:
      'A HS student referencing MRR demonstrates sophisticated business thinking — they understand subscription economics, churn, and recurring revenue models. The term itself signals business literacy.',
    indicatesLevel: 'impressive',
    detectionKeywords: ['mrr', 'monthly recurring', 'recurring revenue', 'subscription revenue', 'arr', 'annual recurring'],
    detectionConfidence: 'high',
  },
  {
    term: 'Funding raised / investment',
    meaning:
      'External capital invested in the business by angel investors, venture capitalists, grants, or crowdfunding. Indicates that third parties with financial stakes evaluated and believed in the venture.',
    hsContext:
      'Any external funding for a HS student\'s venture is exceptional. Angel investment means an experienced investor put personal capital at risk. Accelerator funding (YC, Techstars) is the highest validation available.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['funding', 'raised', 'investment', 'angel investor', 'venture capital', 'seed round', 'grant', 'crowdfunding', 'backed by'],
    detectionConfidence: 'high',
  },
  {
    term: 'Accelerator / incubator acceptance',
    meaning:
      'Competitive startup programs that provide funding, mentorship, and resources in exchange for equity or participation. Top-tier: Y Combinator, Techstars, 500 Startups. Student-focused: Pear VC, Dorm Room Fund, Contrary Capital.',
    hsContext:
      'Accelerator acceptance means professional evaluators assessed this business as having real potential. Top-tier accelerator acceptance (YC) for a HS student is extraordinarily rare and impressive.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['accelerator', 'incubator', 'y combinator', 'yc', 'techstars', '500 startups', 'accepted into', 'cohort'],
    detectionConfidence: 'high',
  },
  {
    term: 'Employees hired',
    meaning:
      'People employed by the business (paid, with defined roles). Distinct from co-founders, volunteers, or friends helping out. Indicates the business generates enough value to sustain payroll.',
    hsContext:
      'A HS student who has hired employees has crossed a major threshold — they\'re responsible for other people\'s livelihoods. This demonstrates management ability and business scale that is extremely rare for teenagers.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['hired', 'employees', 'team of', 'staff', 'payroll', 'contractors', 'freelancers', 'full-time', 'part-time'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Incorporation / business registration',
    meaning:
      'Formally registering a business entity (LLC, C-Corp, S-Corp, sole proprietorship). Indicates legal formalization beyond a hobby project.',
    hsContext:
      'Incorporation shows the student took the legal steps to formalize their business. A C-Corp (vs. LLC) often indicates intent to raise venture funding. By itself it\'s a low bar, but combined with revenue and customers it confirms seriousness.',
    indicatesLevel: 'notable',
    detectionKeywords: ['incorporated', 'llc', 'corporation', 'registered business', 'ein', 'business license', 'c-corp', 's-corp'],
    detectionConfidence: 'medium',
  },
  {
    term: 'Patent',
    meaning:
      'A government-granted exclusive right to an invention. Requires demonstrating novelty, non-obviousness, and utility through a formal application process (USPTO).',
    hsContext:
      'A granted patent (not just "patent pending" which can be filed by anyone) for a HS student is extremely impressive — it means the USPTO determined their invention is genuinely novel. Patent pending still shows initiative but is a much lower bar.',
    indicatesLevel: 'exceptional',
    detectionKeywords: ['patent', 'patent pending', 'provisional patent', 'patent granted', 'patent filed', 'intellectual property', 'ip'],
    detectionConfidence: 'high',
  },
];

export const ENTREPRENEURSHIP_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'entrepreneurship',
  label: 'Entrepreneurship & Business',
  overview:
    'Entrepreneurship is the most inflation-prone activity category on college applications. "Founder/CEO" has become so overused that AOs are actively skeptical of it. The antidote is evidence: revenue, customers, external funding, competition results, and employees. A venture with $5K in revenue and 200 customers is infinitely more impressive than a "startup" with a pitch deck and no users. The ladder here is defined entirely by evidence of traction, not by ambition or titles.',
  ladder,
  technicalDepthMarkers,
};
