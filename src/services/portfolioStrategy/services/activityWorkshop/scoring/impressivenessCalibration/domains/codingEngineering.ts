/**
 * Coding & Engineering — Impressiveness Calibration Domain
 *
 * Covers: software development, app/web development, hardware/robotics,
 * open-source contributions, hackathons, startups, and technical
 * entrepreneurship.
 *
 * Key insight for AOs: Unlike research and competitions, coding/engineering
 * achievements are evaluated on REAL-WORLD IMPACT. AOs don't care about
 * the language used or the framework chosen — they care about WHO uses it,
 * WHAT problem it solves, and whether it ACTUALLY works in the real world.
 * The progression is: tutorial follower → original builder → impactful
 * creator → entrepreneurial engineer.
 */

import type { ImpressivenessDomain } from '../types';

export const CODING_ENGINEERING_IMPRESSIVENESS: ImpressivenessDomain = {
  domainId: 'coding_engineering',
  label: 'Coding & Engineering',
  overview:
    'Coding and engineering projects are among the most common activities listed by STEM applicants, which means the bar for differentiation is high. AOs see hundreds of "built a website" or "made an app" descriptions per cycle. The differentiator is not WHAT you built but the evidence that it MATTERS — real users, real problems solved, real impact measured. A simple tool used daily by 500 people is more impressive than a sophisticated ML model that nobody uses. AOs also value engineering judgment: choosing the right solution for the problem, not the most technically complex one.',

  ladder: [
    // ── BASELINE ──────────────────────────────────────────────────────────
    {
      level: 'baseline',
      description:
        'Followed online tutorials to build a website or app. School CS class project. Personal portfolio site. Calculator, to-do list, or other common tutorial projects. Basic Arduino or Raspberry Pi tinkering from a kit.',
      whyImpressive:
        'AOs see this as "learned to code," which is positive but completely undifferentiating. Every CS-interested applicant at a selective school has done this. Tutorial projects — even complex-looking ones — demonstrate the ability to follow instructions, not to solve problems. AOs are specifically trained to distinguish tutorial output from original work. Listing this as a primary activity signals that the student hasn\'t yet applied their skills to anything original.',
      prevalence:
        'Ubiquitous among CS applicants. ~70-80% of STEM applicants list some form of coding project or coursework.',
      applicantPercentile: 'Top 70-80%',
      verificationMarkers: [
        'Project description matches common tutorial outcomes',
        'No mention of users, deployment, or real-world application',
        'Technologies listed without context of why they were chosen',
        'No evidence of problem-solving beyond the tutorial scope',
        'GitHub repository (if linked) shows minimal original commits',
      ],
      differentiatorFromBelow: 'At least learned to code and built something functional.',
      differentiatorFromAbove:
        'No original problem identification. No users beyond the student themselves. No evidence that the project required decisions about architecture, design, or trade-offs. The student built what someone else designed.',
      tierRange: [5, 6],
    },

    // ── NOTABLE ───────────────────────────────────────────────────────────
    {
      level: 'notable',
      description:
        'Original project solving a real problem — school scheduling tool, community resource finder, accessibility helper. Hackathon participant with a functional prototype. Contributor to an open-source project (meaningful PRs merged, not just typo fixes). Robotics team member with specific engineering contributions. Self-taught beyond curriculum with demonstrable projects.',
      whyImpressive:
        'AOs see the critical jump from "following tutorials" to "identifying and solving a real problem." The student chose WHAT to build, not just HOW to build it. Hackathon participation shows the ability to work under pressure and collaborate. Open-source contribution means engaging with professional codebases and having code reviewed by experienced developers. This level tells AOs: this student can apply technical skills to real situations, which is exactly what college CS programs develop.',
      prevalence:
        'Common among strong CS applicants. ~20-30% of CS-interested applicants at T30 schools have a genuinely original project or meaningful external contribution.',
      applicantPercentile: 'Top 20-30%',
      verificationMarkers: [
        'Clear problem statement distinct from tutorial projects',
        'Specific users or community served (even if small)',
        'Hackathon name and outcome (not just "participated")',
        'Open-source project name with link to merged PRs',
        'Can describe technical decisions and trade-offs made',
        'Evidence of iteration — the project evolved based on feedback',
      ],
      differentiatorFromBelow:
        'Original problem identification and solution design. The student decided WHAT to build and WHY, not just how to build what someone else specified.',
      differentiatorFromAbove:
        'Impact is limited — the project works but has few users or hasn\'t been tested at scale. The student built something original but hasn\'t yet proven it can survive contact with real-world usage at significant scale.',
      tierRange: [4],
    },

    // ── IMPRESSIVE ────────────────────────────────────────────────────────
    {
      level: 'impressive',
      description:
        'Published app or tool with significant user adoption (500+ active users). Major hackathon winner (HackMIT, TreeHacks, CalHacks, or equivalent). Meaningful open-source contributor with sustained involvement — feature ownership, code review participation, release contributions. Technical project with measurable community impact. Robotics team lead at competitive level (FRC with meaningful engineering role).',
      whyImpressive:
        'This is where AOs see a future engineer, not just a coder. Having 500+ active users means the student didn\'t just build something — they deployed it, maintained it, handled real user feedback, and kept it running. Major hackathon wins are competitive (often 1,000+ participants, judges are industry professionals). Sustained open-source contribution shows the ability to work within large codebases and collaborate with professional developers. These students demonstrate the full engineering lifecycle: identify problem → design solution → build → deploy → iterate.',
      prevalence:
        'Uncommon. ~5-10% of CS applicants at T20 schools. Building something that real people actually use is surprisingly rare among HS students.',
      applicantPercentile: 'Top 5-10%',
      verificationMarkers: [
        'Specific user count with metrics (DAU, MAU, downloads)',
        'App store listing, Product Hunt launch, or deployment URL',
        'Hackathon name with placing/award and project description',
        'Open-source project with visible contribution history',
        'Evidence of deployment infrastructure (hosting, CI/CD, monitoring)',
        'User testimonials, press coverage, or community feedback',
        'Iteration history — version updates, feature additions based on usage',
      ],
      differentiatorFromBelow:
        'External validation through users, competition judges, or open-source maintainers. The student\'s work has been tested by the real world and survived. Impact is measurable, not just claimed.',
      differentiatorFromAbove:
        'Scale is meaningful but not extraordinary. Hundreds of users, not tens of thousands. A hackathon win, not a venture-backed company. Strong engineering, not category-defining innovation.',
      tierRange: [3],
    },

    // ── EXCEPTIONAL ───────────────────────────────────────────────────────
    {
      level: 'exceptional',
      description:
        'Y Combinator-backed or investor-funded project. Apple WWDC Scholar or equivalent platform recognition. Widely-used open-source tool (1,000+ GitHub stars, significant community). Product with substantial user base (5,000+ active users) and revenue. Google Science Fair finalist or equivalent. Significant technical contribution to a major platform or tool.',
      whyImpressive:
        'AOs see these students as already operating in the professional world. YC and professional investors have rigorous selection processes — if they funded a HS student, that student demonstrated exceptional ability and maturity. WWDC Scholars are selected by Apple from thousands of applicants, specifically for technical creativity. A widely-used open-source tool means the student built something that professional developers rely on. Revenue generation proves the student can create economic value, not just technical novelty. These students don\'t need college to start their careers — they\'re choosing to attend, which makes them especially compelling admits.',
      prevalence:
        'Rare. ~1-2% of applicants even at T5 schools. Fewer than 200-300 HS students nationally per year achieve this level.',
      applicantPercentile: 'Top 1-2%',
      verificationMarkers: [
        'YC batch number or investor names',
        'WWDC Scholar with year and project description',
        'GitHub repository with 1,000+ stars and active community',
        'Revenue figures or business metrics',
        'App store rankings or Product Hunt featured status',
        'Google Science Fair or equivalent finalist confirmation',
        'Press coverage from tech publications',
        'User base with retention metrics (not just downloads)',
      ],
      differentiatorFromBelow:
        'Professional-level validation. Investors, major tech companies, or large developer communities have evaluated this student\'s work against professional standards and found it exceptional. Scale has moved from hundreds to thousands.',
      differentiatorFromAbove:
        'Impact is significant but not viral or industry-disrupting. The project is impressive for a HS student but hasn\'t fundamentally changed how people do something. Revenue is promising but not yet at scale. Recognition is from the tech community, not mainstream awareness.',
      tierRange: [2],
    },

    // ── EXTRAORDINARY ─────────────────────────────────────────────────────
    {
      level: 'extraordinary',
      description:
        'Viral product with 100,000+ users. Significant revenue-generating business ($50K+ or growing rapidly). Startup acquired by a major company. Open-source project that became an industry standard or widely-adopted tool. Major security vulnerability discovery with CVE. Technology featured in mainstream media (NYT, WSJ, major tech outlets).',
      whyImpressive:
        'AOs encounter these applicants extremely rarely — perhaps once every 2-3 admission cycles. A product with 100K+ users means the student created something that achieved organic growth at a scale most professional startups never reach. Revenue at this level from a HS student is almost unprecedented. An acquisition means professional companies valued the student\'s work enough to purchase it. These achievements transcend "impressive for a HS student" — they are impressive by any standard. AOs don\'t evaluate these students; they advocate for them. The committee conversation is about securing the admit, not debating it.',
      prevalence:
        'Extraordinarily rare. <0.01% of all applicants. Perhaps 20-50 HS students nationally per year.',
      applicantPercentile: 'Top 0.01%',
      verificationMarkers: [
        'Verifiable user count through public metrics or app store data',
        'Revenue documentation or business filings',
        'Acquisition announcement or company registration',
        'GitHub project with massive star count and widespread adoption',
        'CVE number for security discoveries',
        'Mainstream media coverage with named articles',
        'Industry recognition beyond the student/youth community',
        'Product still actively used and maintained',
      ],
      differentiatorFromBelow:
        'Impact at a scale that transcends the HS context entirely. These achievements would be impressive on a professional resume, let alone a college application. The student has created something that meaningfully changed how thousands of people work, learn, or live.',
      differentiatorFromAbove:
        'This is the ceiling for HS coding/engineering. These students have achieved what most professional engineers and entrepreneurs spend careers pursuing. There is no higher level.',
      tierRange: [1],
    },
  ],

  technicalDepthMarkers: [
    {
      term: 'active users (DAU/MAU)',
      meaning:
        'Daily Active Users and Monthly Active Users — the standard metrics for measuring real product usage. DAU/MAU ratio indicates engagement depth.',
      hsContext:
        'Mentioning specific user metrics transforms a project description from "I built this" to "people actually use this." AOs can\'t verify exact numbers, but specificity signals authenticity. "200 daily active users" is more credible than "thousands of users." A DAU/MAU ratio above 30% indicates a sticky product.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['active users', 'DAU', 'MAU', 'daily users', 'monthly users', 'user base', 'user count'],
      detectionConfidence: 'high',
    },
    {
      term: 'GitHub stars / open-source adoption',
      meaning:
        'GitHub stars are a proxy for developer interest in an open-source project. Stars alone don\'t indicate usage, but combined with forks, issues, and PRs, they signal real adoption.',
      hsContext:
        'For HS students, even 50-100 stars on a genuinely original project is notable — it means professional developers found the work interesting. 500+ stars with active issues/PRs indicates a project with real community. 1,000+ is exceptional for any individual contributor.',
      indicatesLevel: 'notable',
      detectionKeywords: ['GitHub stars', 'open source', 'stars on GitHub', 'forks', 'pull requests', 'contributors'],
      detectionConfidence: 'medium',
    },
    {
      term: 'production deployment',
      meaning:
        'Running software in a production environment where real users depend on it. Includes hosting, monitoring, uptime management, and incident response.',
      hsContext:
        'Most HS projects run only on the student\'s laptop. Deploying to production — handling hosting costs, SSL certificates, uptime monitoring, and real user data — shows engineering maturity far beyond the classroom. It indicates the student understands that building is only half the work.',
      indicatesLevel: 'notable',
      detectionKeywords: ['deployed', 'production', 'hosted on', 'live at', 'available at', 'launched on', 'in production'],
      detectionConfidence: 'medium',
    },
    {
      term: 'CI/CD pipeline',
      meaning:
        'Continuous Integration / Continuous Deployment — automated testing and deployment workflows. Industry standard for professional software development.',
      hsContext:
        'Setting up CI/CD shows awareness of professional engineering practices. Most HS students code without any automation. Having automated tests that run on every commit and automated deployment indicates the student has worked in or studied professional environments.',
      indicatesLevel: 'notable',
      detectionKeywords: ['CI/CD', 'continuous integration', 'continuous deployment', 'GitHub Actions', 'automated testing', 'deployment pipeline'],
      detectionConfidence: 'high',
    },
    {
      term: 'load handling / scalability',
      meaning:
        'Designing systems that can handle increasing numbers of users or requests without degradation. Includes caching, load balancing, database optimization.',
      hsContext:
        'Encountering and solving scalability problems means the student\'s project actually got enough users to stress the system. This is rare for HS projects and indicates real-world impact. Mentioning specific challenges ("handled 10K concurrent requests" or "optimized database queries from 2s to 50ms") is very strong evidence.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['scalability', 'load balancing', 'concurrent users', 'performance optimization', 'caching', 'handled traffic'],
      detectionConfidence: 'medium',
    },
    {
      term: 'test coverage',
      meaning:
        'The percentage of code covered by automated tests. Industry practice is 70-90% for production code.',
      hsContext:
        'Writing tests is a discipline most HS coders never develop. Mentioning test coverage indicates professional-quality engineering practices and an understanding that software reliability matters as much as features. It\'s a quiet signal of engineering maturity.',
      indicatesLevel: 'notable',
      detectionKeywords: ['test coverage', 'unit tests', 'integration tests', 'automated tests', 'test suite', 'testing framework'],
      detectionConfidence: 'medium',
    },
    {
      term: 'API design',
      meaning:
        'Designing interfaces that other software or developers interact with. Good API design requires thinking about users (developers), versioning, error handling, and documentation.',
      hsContext:
        'Building an API that other developers use shows the student can think about software as a service, not just a standalone product. If other projects depend on their API, the student has created infrastructure — a qualitatively different kind of engineering than building a standalone app.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['API', 'REST API', 'GraphQL', 'API endpoint', 'developer documentation', 'API consumers', 'webhook'],
      detectionConfidence: 'medium',
    },
    {
      term: 'system architecture',
      meaning:
        'High-level design of a software system — how components interact, data flows, and services are organized. Requires thinking about the whole system, not just individual features.',
      hsContext:
        'Describing system architecture (e.g., "microservices," "event-driven," "client-server with WebSocket") signals that the student thinks at a systems level. Most HS coders build monolithic scripts. Architectural thinking indicates readiness for CS coursework and research.',
      indicatesLevel: 'impressive',
      detectionKeywords: ['architecture', 'microservices', 'system design', 'infrastructure', 'distributed', 'event-driven', 'client-server'],
      detectionConfidence: 'low',
    },
    {
      term: 'revenue / monetization',
      meaning:
        'Generating money from a technical product. Indicates the student solved a problem people are willing to pay for.',
      hsContext:
        'Revenue is the ultimate validation — someone valued the student\'s work enough to pay for it. Even small revenue ($100/month) from a HS project is exceptional because it proves product-market fit. AOs see this as evidence of entrepreneurial ability combined with technical skill.',
      indicatesLevel: 'exceptional',
      detectionKeywords: ['revenue', 'monetization', 'paying users', 'subscription', 'MRR', 'ARR', 'income', 'profit', 'sales'],
      detectionConfidence: 'high',
    },
    {
      term: 'security vulnerability discovery',
      meaning:
        'Finding and responsibly disclosing security vulnerabilities in existing software. Requires deep technical understanding and ethical judgment.',
      hsContext:
        'Responsible disclosure of a real vulnerability (especially with a CVE number) is exceptional. It demonstrates deep technical skill, ethical maturity, and recognition from the security community. AOs may not understand the technical details but recognize the external validation.',
      indicatesLevel: 'exceptional',
      detectionKeywords: ['CVE', 'vulnerability', 'security disclosure', 'bug bounty', 'responsible disclosure', 'security researcher'],
      detectionConfidence: 'high',
    },
  ],
};
