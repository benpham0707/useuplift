/**
 * Entrepreneurship & Business Expertise Domain
 *
 * Covers: tech startups, social enterprises, small businesses, freelancing,
 * e-commerce, nonprofit founding, side projects, app development.
 *
 * Key AO lens: Entrepreneurship is the MOST inflated activity category. AOs have
 * developed sharp BS detectors for "CEO of a project with no users." The bar is
 * clear: TRACTION proves everything. Revenue, users, customers, and external
 * validation are the only things that separate real entrepreneurs from students
 * who registered an LLC. Title inflation is the #1 red flag.
 *
 * Sources: Sara Harberson (former Penn AO), MIT admissions blog, Stanford
 * entrepreneurship admissions guidance, NACAC surveys, Y Combinator application
 * standards, published AO insights on evaluating student ventures.
 */

import type { ExpertiseDomain } from '../types';

export const ENTREPRENEURSHIP_DOMAIN: ExpertiseDomain = {
  domainId: 'entrepreneurship',
  label: 'Entrepreneurship & Business',
  overview:
    'Entrepreneurship is simultaneously the most impressive and most inflated activity category. ' +
    'AOs are deeply skeptical because they see hundreds of "CEO/Founder" titles from students who ' +
    'built a website that nobody visited. The single most important question is TRACTION: does ' +
    'anyone actually use, buy, or benefit from this? Revenue, active users, paying customers, ' +
    'and external validation (competitions, accelerators, press) are the currency of credibility. ' +
    'An idea is worth nothing. Execution with evidence is worth everything.',

  aoExpectations: {
    whatRegisters: [
      'Traction metrics — revenue, active users, paying customers, retention rates',
      'External validation — accepted to accelerators, won pitch competitions, secured funding from non-family sources',
      'Problem identification — did the student identify a REAL problem or invent a solution in search of a problem?',
      'Growth trajectory — Month 1 vs Month 6 numbers show whether the venture is real',
      'Team building — hiring, managing, delegating proves the venture outgrew one person',
      'Pivot and iteration — changing course based on evidence shows genuine entrepreneurial thinking',
    ],
    whatAOsSeeThrough: [
      'Title inflation — "CEO" of a project with no revenue or users is a red flag, not a credential',
      'Technology stack as the achievement — AOs do not care what language you coded in, they care who uses the product',
      '"Startup" without traction — an idea + a website is not a startup, it is a hobby project',
      'Business plans and pitch decks without execution — documents are not businesses',
      'Revenue from family and friends — $500 from relatives is not market validation',
      '"Social enterprise" without beneficiaries — using the label without serving anyone is performative',
    ],
    goldenQuestion:
      'If this student stopped working on this tomorrow, would anyone besides them notice or care?',
    readingTimeContext:
      'AOs spend about 8-10 seconds on each activity entry, but entrepreneurship descriptions ' +
      'get slightly MORE scrutiny because AOs are actively looking for inflation signals. ' +
      'The first sentence must establish credibility through metrics, not titles. ' +
      '"Founded tech startup" triggers skepticism; "$12K revenue in first year" triggers interest.',
    competitiveContext:
      'At top schools, 15-20% of applicants claim some form of entrepreneurship. The vast majority ' +
      'are unfunded projects with no users. Students with REAL traction (revenue, significant user ' +
      'base, external funding, accelerator acceptance) stand in the top 1-2% of this category. ' +
      'AOs at Stanford and MIT have said they can tell within seconds whether a venture is real.',
  },

  realExpertiseSignals: [
    {
      id: 'ent_revenue_metrics',
      pattern: 'revenue_validation',
      description:
        'Specific revenue figures that demonstrate market validation — people paying real money ' +
        'for the product or service',
      whyItWorks:
        'Revenue is the ultimate proof of value. If strangers pay you money, your product ' +
        'solves a real problem. AOs know this is the hardest metric to fake and the most ' +
        'meaningful to achieve. Even modest revenue ($1K-$5K) from real customers is impressive ' +
        'for a high school student.',
      examples: [
        '$12K revenue in first year from 400+ paying customers across 3 states',
        'Monthly recurring revenue grew from $200 to $2,800 over 8 months',
        'Profitable by month 4; reinvested $3K in inventory, maintained 45% margins',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'revenue', 'profit', 'sales', 'income', 'customers', 'paying',
        'MRR', 'ARR', 'margins', 'profitable', 'earned', 'generated',
      ],
    },
    {
      id: 'ent_user_traction',
      pattern: 'user_growth',
      description:
        'Active user counts with growth trajectory — not just "launched" but how many people ' +
        'actually use the product and how that number changed over time',
      whyItWorks:
        'User numbers prove market fit. Growth trajectory proves the product is getting better ' +
        'or spreading organically. AOs can instantly distinguish between "launched app" (maybe 5 downloads) ' +
        'and "2,400 active users, 40% month-over-month growth" (real traction).',
      examples: [
        '2,400 active users; 40% month-over-month growth for 6 consecutive months',
        'App downloaded 8,000 times; 1,200 daily active users, 4.6 star rating',
        'Platform serves 15 schools and 3,200 students; 92% weekly retention',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'users', 'active users', 'DAU', 'MAU', 'downloads', 'signups',
        'retention', 'growth', 'month-over-month', 'weekly', 'daily',
      ],
    },
    {
      id: 'ent_customer_validation',
      pattern: 'market_validation',
      description:
        'Evidence that real customers (not family/friends) validated the product through ' +
        'purchases, reviews, repeat usage, or referrals',
      whyItWorks:
        'Customer validation from strangers is the clearest signal of product-market fit. ' +
        'AOs know the difference between "my mom bought 10 candles" and "400 customers ' +
        'found me through Instagram, 60% repeat purchase rate." The latter proves something ' +
        'the former does not.',
      examples: [
        '400 paying customers, 92% 5-star reviews, 60% repeat purchase rate',
        'Customer waitlist of 200+ before launch; sold out first batch in 48 hours',
        'Net Promoter Score of 72 from 150 surveyed customers; 40% came through referrals',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'customers', 'clients', 'repeat', 'retention', 'reviews', 'rating',
        'referral', 'waitlist', 'sold out', 'demand', 'NPS', 'satisfaction',
      ],
    },
    {
      id: 'ent_problem_market_fit',
      pattern: 'problem_identification',
      description:
        'Clear articulation of the specific problem being solved and the specific market ' +
        'being served — evidence the student studied the problem before building the solution',
      whyItWorks:
        'AOs value problem-first thinking over technology-first thinking. A student who says ' +
        '"identified that rural students lack SAT prep access, built platform serving 8 schools" ' +
        'shows analytical thinking. A student who says "built an app using React and Firebase" ' +
        'shows they can code but not think.',
      examples: [
        'Identified gap: no affordable SAT prep for rural students; built platform now serving 8 schools in 3 counties',
        'Surveyed 200 local small businesses; 80% lacked online ordering — built platform, onboarded 45 restaurants',
        'After interviewing 50 teachers, designed classroom tool that reduced grading time 40%',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'identified', 'discovered', 'problem', 'gap', 'need', 'underserved',
        'surveyed', 'interviewed', 'researched', 'market', 'demand',
      ],
    },
    {
      id: 'ent_growth_trajectory',
      pattern: 'growth_evidence',
      description:
        'Month-over-month or milestone-based growth that shows the venture is accelerating, ' +
        'not stagnant — the trajectory matters as much as the current number',
      whyItWorks:
        'Growth trajectory tells AOs whether the venture is alive and improving or was a one-time ' +
        'project. "Month 1: 10 users, Month 6: 800 users" is a story of execution and iteration. ' +
        'Static numbers ("launched with 50 users") suggest the project plateaued.',
      examples: [
        'Month 1: 10 users → Month 6: 800 users → Month 12: 3,200 users (organic growth)',
        'Year 1: $2K revenue. Year 2: $8K revenue. Year 3: $22K revenue from 3 product lines',
        'First event: 30 attendees. By event 8: 400 attendees, corporate sponsors, and media coverage',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'grew', 'growth', 'month', 'year', 'trajectory', 'doubled',
        'tripled', 'from', 'to', 'increased', 'expanded', 'scaled',
      ],
    },
    {
      id: 'ent_team_building',
      pattern: 'team_management',
      description:
        'Hired, managed, or led a team — evidence the venture outgrew one person and the ' +
        'student demonstrated real management ability',
      whyItWorks:
        'A one-person project can be impressive, but building a team proves the venture was ' +
        'big enough to need one. Managing others — especially peers or paid employees — demonstrates ' +
        'leadership, delegation, and interpersonal skills that AOs value highly.',
      examples: [
        'Hired and managed 4 part-time employees; created onboarding process and weekly review system',
        'Built team of 6 student developers; used agile sprints and code reviews to ship features weekly',
        'Recruited 3 co-founders with complementary skills (design, marketing, operations)',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'hired', 'managed', 'team', 'employees', 'co-founder', 'staff',
        'recruited', 'delegation', 'onboarding', 'payroll', 'contractors',
      ],
    },
    {
      id: 'ent_external_validation',
      pattern: 'competition_accelerator',
      description:
        'Acceptance into recognized programs, winning competitions, or receiving grants — ' +
        'external parties with no obligation to be kind validated the venture',
      whyItWorks:
        'External validation from credible organizations is powerful because it is independent ' +
        'and comparative. Winning a pitch competition means judges evaluated your venture against ' +
        'others and chose you. Acceptance into an accelerator means experienced investors believed ' +
        'in your potential. This is third-party proof.',
      examples: [
        'Accepted into Y Combinator Startup School; one of 200 high school ventures selected globally',
        'Won $5K first prize at state entrepreneurship competition from 120 entries',
        'Received $10K grant from local economic development council for social impact',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'accepted', 'selected', 'won', 'awarded', 'grant', 'prize',
        'competition', 'accelerator', 'incubator', 'fellowship', 'pitch',
      ],
    },
    {
      id: 'ent_pivot_iteration',
      pattern: 'strategic_pivot',
      description:
        'Changed strategy based on data or customer feedback — evidence of genuine ' +
        'entrepreneurial thinking and learning from the market',
      whyItWorks:
        'Pivoting is the hallmark of real entrepreneurs. It proves the student is listening ' +
        'to the market, not just attached to their original idea. AOs know that the ability to ' +
        'adapt based on evidence is far more valuable than the ability to execute a plan. ' +
        'Only someone running a real venture has data to pivot on.',
      examples: [
        'Pivoted from B2C to B2B after 200 user interviews revealed schools would pay but students would not',
        'Original product failed (12 users after 3 months); rebuilt around core feature, reached 500 users in 6 weeks',
        'Shifted from physical product to digital after supply chain costs made margins unsustainable',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'pivoted', 'pivot', 'shifted', 'changed', 'iterated', 'learned',
        'feedback', 'data', 'user interviews', 'redesigned', 'rebuilt',
      ],
    },
    {
      id: 'ent_financial_literacy',
      pattern: 'financial_management',
      description:
        'Understanding of real business financials — margins, unit economics, reinvestment, ' +
        'cash flow — not just revenue claims',
      whyItWorks:
        'Financial literacy separates real business operators from students who made a few sales. ' +
        'Mentioning margins, reinvestment decisions, or unit economics shows the student understands ' +
        'business fundamentals — not just the creative side but the survival side.',
      examples: [
        'Maintained 45% profit margin after material cost increases; renegotiated with 3 suppliers',
        'Reinvested 100% of Year 1 profits ($3K) into inventory; achieved $8K revenue in Year 2',
        'Calculated unit economics: $4 cost per item, $12 selling price, break-even at 50 units/month',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'margin', 'profit', 'cost', 'reinvested', 'expenses', 'break-even',
        'unit economics', 'cash flow', 'pricing', 'overhead', 'ROI',
      ],
    },
    {
      id: 'ent_social_impact_measured',
      pattern: 'impact_metrics_social',
      description:
        'For social enterprises: specific, measured impact on the population served — ' +
        'not just "helping" but quantified outcomes',
      whyItWorks:
        'Social enterprises face double scrutiny: AOs evaluate both the business viability AND ' +
        'the social impact. "Social enterprise serving underrepresented students" is a claim. ' +
        '"Platform matched 200 first-gen students with college mentors; 85% enrollment rate vs 60% avg" ' +
        'is evidence of both viability and impact.',
      examples: [
        'Platform matched 200 first-gen students with mentors; 85% enrolled in college vs 60% district avg',
        'Donated 500 refurbished laptops to 12 Title I schools; device-to-student ratio improved from 1:8 to 1:2',
        'App connected 150 elderly residents to grocery delivery volunteers during pandemic; served 40+ weekly',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'impact', 'served', 'beneficiaries', 'community', 'donated',
        'connected', 'matched', 'underserved', 'social', 'mission',
      ],
    },
    {
      id: 'ent_customer_acquisition',
      pattern: 'marketing_channels',
      description:
        'Specific customer acquisition strategies and channels — how the student got customers, ' +
        'not just that they have them',
      whyItWorks:
        'Understanding customer acquisition proves business sophistication. AOs can distinguish ' +
        'between "my parents told their friends" and "built Instagram following of 5K through ' +
        'content marketing; 30% of customers come from social." The HOW matters.',
      examples: [
        'Grew Instagram to 5K followers through weekly content; 30% of customers acquired through social',
        'Partnered with 8 local businesses for cross-promotion; generated 40% of revenue through referrals',
        'Cold-emailed 100 schools; 15 responded, 8 became paying customers within 3 months',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'acquired', 'marketing', 'social media', 'followers', 'referral',
        'partnership', 'outreach', 'cold email', 'SEO', 'content',
      ],
    },
    {
      id: 'ent_operational_complexity',
      pattern: 'operations_management',
      description:
        'Managing real operational complexity — supply chain, inventory, shipping, ' +
        'customer support — evidence the business has real moving parts',
      whyItWorks:
        'Operations management proves the business is real and has scale. A student who manages ' +
        'inventory, fulfills orders, and handles customer complaints is running a REAL business. ' +
        'AOs recognize that operational challenges are the most underrated form of learning.',
      examples: [
        'Managed inventory of 200+ SKUs; built Shopify store, processed 50+ orders weekly',
        'Negotiated with 3 suppliers for raw materials; reduced cost per unit 20% by ordering in bulk',
        'Handled 20+ customer service inquiries weekly; maintained 4.8/5 satisfaction rating',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'inventory', 'supply chain', 'shipping', 'fulfillment', 'orders',
        'suppliers', 'operations', 'logistics', 'customer service', 'support',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'ent_title_inflation',
      pattern: '"CEO" / "Founder" of a project with no traction',
      whyStudentsUseIt:
        'Students believe titles communicate authority and impressiveness. "CEO" sounds more ' +
        'important than "started a small business." Social media culture reinforces the idea ' +
        'that the title IS the achievement.',
      whyItFails:
        'AOs at selective schools have said this is the #1 red flag in entrepreneurship activities. ' +
        '"CEO" with no revenue or users reads as delusional, not impressive. The title-to-traction ' +
        'ratio is the first thing experienced readers check. An inflated title with no metrics ' +
        'is worse than no title with real metrics.',
      betterAlternative:
        'Lead with traction, not title. The title field exists separately — use the description ' +
        'for evidence. If you have real traction, the title becomes credible. If you do not, ' +
        'no title will save you.',
      example: {
        nameDrop: 'Founder and CEO of innovative tech startup disrupting the education space',
        improved: '$8K revenue, 1,200 users across 6 schools; built tool that cuts teacher grading time 40%',
        whatChanged:
          'Removed inflated title and buzzwords ("innovative", "disrupting"). Replaced with three ' +
          'pieces of evidence: revenue ($8K), reach (1,200 users, 6 schools), and specific value ' +
          'proposition (40% grading time reduction). The evidence IS the story.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'CEO', 'founder', 'co-founder', 'president', 'CTO', 'COO',
        'chief', 'director', 'head of', 'managing director',
      ],
    },
    {
      id: 'ent_tech_stack_namedrop',
      pattern: 'Technology stack as the achievement',
      whyStudentsUseIt:
        'Students who code are proud of their technical skills and believe naming languages ' +
        'and frameworks communicates competence. In their peer group, "built with React, Node.js, ' +
        'and PostgreSQL" sounds impressive.',
      whyItFails:
        'AOs are not engineers. "React, Node.js, PostgreSQL" means nothing to them. These words ' +
        'consume 25+ characters while communicating zero about what the product DOES or who it ' +
        'SERVES. The technology is the how, not the what — and AOs care about the what.',
      betterAlternative:
        'Replace the technology stack with the problem solved and the people served. ' +
        '"Built web app using React" → "Built scheduling platform used by 15 sports teams." ' +
        'The tech stack can be mentioned in supplemental materials or interviews.',
      example: {
        nameDrop: 'Built a full-stack web application using React, Node.js, and MongoDB to help students study',
        improved: 'Built study platform used daily by 800 students at 4 schools; avg quiz scores improved 15%',
        whatChanged:
          'Removed technology names (React, Node.js, MongoDB — 30 wasted characters). Replaced ' +
          'with user count (800), reach (4 schools), and measurable outcome (15% score improvement). ' +
          'AOs now know WHAT it does and WHY it matters.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'React', 'Node', 'Python', 'JavaScript', 'MongoDB', 'Firebase',
        'SQL', 'API', 'AWS', 'full-stack', 'frontend', 'backend',
        'machine learning', 'AI', 'algorithm', 'framework', 'stack',
      ],
    },
    {
      id: 'ent_startup_without_traction',
      pattern: '"Startup" or "business" with no evidence of traction',
      whyStudentsUseIt:
        'Students equate creating something (a website, an LLC, a social media page) with ' +
        'starting a business. "I started a startup" feels like a significant life event.',
      whyItFails:
        'AOs define a "startup" or "business" by evidence of traction. A website with no visitors, ' +
        'an LLC with no revenue, or an app with no downloads is a project, not a business. ' +
        'Calling it a startup without traction creates a credibility gap that undermines everything else.',
      betterAlternative:
        'If you have traction, lead with it and the word "startup" becomes unnecessary. ' +
        'If you do not have traction, describe what you BUILT and LEARNED rather than ' +
        'what you CALLED it.',
      example: {
        nameDrop: 'Launched an innovative startup focused on sustainable fashion for Gen Z consumers',
        improved: 'Designed and sold 200 upcycled denim pieces; $4K revenue, 85% through Instagram marketing, zero ad spend',
        whatChanged:
          'Removed "startup" label and buzzwords ("innovative", "sustainable fashion", "Gen Z"). ' +
          'Replaced with specific product (upcycled denim), sales volume (200 pieces), revenue ($4K), ' +
          'and marketing insight (Instagram, zero ad spend).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'startup', 'start-up', 'launched', 'business', 'company',
        'venture', 'enterprise', 'initiative', 'platform', 'solution',
      ],
    },
    {
      id: 'ent_buzzword_stacking',
      pattern: 'Buzzword stacking ("innovative", "disruptive", "revolutionary")',
      whyStudentsUseIt:
        'Students absorb startup culture language from social media, TechCrunch, and pitch ' +
        'competitions. These words feel like they communicate ambition and vision.',
      whyItFails:
        'Every buzzword is a character spent on a claim instead of evidence. "Innovative" is what ' +
        'OTHER people call your work after seeing the evidence — it is not a self-description. ' +
        'AOs instantly recognize buzzword stacking as a compensation for lack of substance.',
      betterAlternative:
        'Delete every adjective that is not accompanied by a number. "Innovative solution" → ' +
        '"solution used by 500 students." The number IS the innovation proof.',
      example: {
        nameDrop: 'Developed innovative, cutting-edge AI-powered solution revolutionizing how students learn',
        improved: 'Built adaptive quiz tool; 500 students across 3 schools, test scores up avg 12 percentile points',
        whatChanged:
          'Removed 5 buzzwords (innovative, cutting-edge, AI-powered, revolutionizing, how students learn). ' +
          'Replaced with what the tool IS (adaptive quiz), who uses it (500 students, 3 schools), and ' +
          'what it achieves (12 percentile point improvement).',
      },
      prevalence: 'very_common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'innovative', 'revolutionary', 'disruptive', 'cutting-edge',
        'groundbreaking', 'game-changing', 'next-gen', 'state-of-the-art',
        'transformative', 'pioneering', 'world-class', 'unique',
      ],
    },
    {
      id: 'ent_business_plan',
      pattern: '"Created business plan" or "wrote pitch deck" as achievement',
      whyStudentsUseIt:
        'Business classes and entrepreneurship programs emphasize plans and pitches. Students ' +
        'invest significant time in these documents and feel they should count.',
      whyItFails:
        'A business plan is a DOCUMENT, not a BUSINESS. AOs know that writing a plan and executing ' +
        'a business are entirely different skills. Plans sit on shelves; businesses serve customers. ' +
        'Mentioning the plan without execution evidence suggests the student stopped before the hard part.',
      betterAlternative:
        'Skip the plan and describe the execution. If the plan led to action, describe the action ' +
        'and results. If it did not lead to action, it does not belong in the activity description.',
      example: {
        nameDrop: 'Created comprehensive business plan and pitch deck for sustainable clothing brand',
        improved: 'Launched sustainable clothing line: 150 pieces sold, $3K revenue, featured in 2 local publications',
        whatChanged:
          'Replaced document creation (plan, pitch deck) with business execution (sales, revenue, press). ' +
          'AOs can assume a plan existed — they want to know what happened AFTER the plan.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'business plan', 'pitch deck', 'presentation', 'proposal',
        'strategy document', 'market research', 'competitive analysis',
      ],
    },
    {
      id: 'ent_social_enterprise_label',
      pattern: '"Social enterprise" or "social impact" without beneficiaries',
      whyStudentsUseIt:
        'The "social enterprise" label combines the prestige of entrepreneurship with the moral ' +
        'virtue of service. Students believe it signals both business acumen and social conscience.',
      whyItFails:
        'AOs apply double scrutiny to "social enterprises": they evaluate BOTH the business ' +
        'viability AND the social impact. If neither is quantified, the label reads as ' +
        'virtue-signaling. "Social enterprise" without beneficiary data is like "nonprofit" ' +
        'without people served — an empty claim.',
      betterAlternative:
        'Quantify both the business and the impact. Show that real people benefited and that ' +
        'the model is sustainable. "Social enterprise" is a label; show the substance.',
      example: {
        nameDrop: 'Founded social enterprise addressing educational inequity through technology',
        improved: 'Built free tutoring app for Title I schools; 800 students in 6 schools, avg grade improvement 1 full letter',
        whatChanged:
          'Removed vague label ("social enterprise addressing educational inequity"). Replaced with ' +
          'specific product (free tutoring app), specific beneficiaries (800 students in 6 Title I schools), ' +
          'and measurable impact (1 full letter grade improvement).',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'social enterprise', 'social impact', 'social venture', 'impact-driven',
        'mission-driven', 'for good', 'giving back', 'changemaker',
      ],
    },
    {
      id: 'ent_raised_funding_vague',
      pattern: '"Raised funding" without source context',
      whyStudentsUseIt:
        'Fundraising sounds impressive and mirrors what "real" startups do. Students want to ' +
        'position themselves as capable of attracting investment.',
      whyItFails:
        'AOs immediately ask: funding from WHOM? A $5K investment from parents is not the same ' +
        'as $5K from a pitch competition or angel investor. Without source context, AOs assume ' +
        'the least impressive interpretation. Vague funding claims often backfire.',
      betterAlternative:
        'Specify the source and the validation it represents. "Won $5K at state pitch competition" ' +
        'proves external validation. "Received $5K grant from community foundation" proves ' +
        'institutional credibility. The source IS the story.',
      example: {
        nameDrop: 'Raised $10,000 in funding to grow my business and expand operations',
        improved: 'Won $5K at state pitch competition (120 entries); used prize + $3K from 2 local angel investors to scale to 3 locations',
        whatChanged:
          'Specified funding sources (competition prize + angel investors), added competitive context ' +
          '(120 entries), and showed what the funding enabled (scaling to 3 locations). Each dollar ' +
          'now has a credible origin story.',
      },
      prevalence: 'common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'raised', 'funding', 'investment', 'capital', 'seed',
        'investors', 'secured', 'financing', 'backed',
      ],
    },
    {
      id: 'ent_launch_without_adoption',
      pattern: '"Launched" without adoption metrics',
      whyStudentsUseIt:
        'Launching feels like a milestone. Students are proud of shipping a product and believe ' +
        'the act of launching is itself impressive.',
      whyItFails:
        'AOs know that launching is the BEGINNING, not the achievement. Anyone can put a website ' +
        'online or publish an app. The question is: did anyone use it? "Launched" without adoption ' +
        'metrics is like "wrote a book" without sales — it leaves the most important question unanswered.',
      betterAlternative:
        'Replace "launched" with what happened AFTER launch. Lead with adoption, retention, or ' +
        'revenue. If nobody used it, describe what you LEARNED from the failure instead.',
      example: {
        nameDrop: 'Launched mobile application designed to connect students with local volunteer opportunities',
        improved: 'App connects students to volunteer opportunities; 1,800 downloads, 400 monthly active users, 600 volunteer hours facilitated',
        whatChanged:
          'Removed "launched" (implies the launch WAS the achievement). Added three proof points: ' +
          'downloads (1,800), active usage (400 MAU), and real-world impact (600 volunteer hours). ' +
          'The app\'s value is now undeniable.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'launched', 'released', 'deployed', 'published', 'shipped',
        'introduced', 'unveiled', 'debuted', 'rolled out',
      ],
    },
    {
      id: 'ent_patent_pending',
      pattern: '"Patent pending" or "trademarked" as achievement',
      whyStudentsUseIt:
        'Filing a patent or trademark feels like official validation. Students believe it signals ' +
        'that their idea is unique and legally protected.',
      whyItFails:
        'Anyone can file a patent application or register a trademark. These are administrative ' +
        'and legal actions, not evidence of innovation or impact. AOs know that a provisional ' +
        'patent costs $65 and requires no review. "Patent pending" without product-market fit ' +
        'is bureaucracy, not business.',
      betterAlternative:
        'The invention itself — and its impact — is what matters. Describe what the invention ' +
        'does, who uses it, and why it matters. If the patent is granted (not pending), it can ' +
        'add credibility, but only alongside usage evidence.',
      example: {
        nameDrop: 'Invented novel device for water purification; patent pending, trademarked brand name',
        improved: 'Designed low-cost water filter ($3/unit) deployed in 4 villages; provides clean water to 500+ families',
        whatChanged:
          'Removed legal status (patent pending, trademark — irrelevant to impact). Replaced with ' +
          'practical details: cost ($3/unit proves scalability), deployment (4 villages proves real use), ' +
          'and beneficiaries (500+ families proves impact).',
      },
      prevalence: 'occasional',
      typicalCharWaste: 25,
      detectionKeywords: [
        'patent', 'patent pending', 'trademark', 'trademarked', 'copyright',
        'IP', 'intellectual property', 'provisional', 'filed',
      ],
    },
    {
      id: 'ent_website_as_business',
      pattern: 'Website or social media presence as the business itself',
      whyStudentsUseIt:
        'Building a website or growing a social media account is tangible, visible work. ' +
        'Students equate the creation of digital assets with running a business.',
      whyItFails:
        'A website is not a business; it is a tool. An Instagram page is not a brand; it is a channel. ' +
        'AOs evaluate what the website/social PRODUCED (sales, signups, impact), not the fact that ' +
        'it exists. "Built a website" is like "rented office space" — a prerequisite, not an achievement.',
      betterAlternative:
        'Describe what the website or social presence ACHIEVED. Followers, conversions, sales, ' +
        'signups — the platform is invisible; the results are the story.',
      example: {
        nameDrop: 'Created professional website and managed social media accounts for my business',
        improved: 'Grew online store to $6K revenue through Instagram marketing; 3,200 followers, 8% conversion rate on posts',
        whatChanged:
          'Replaced infrastructure description (website, social media accounts) with results ' +
          '(revenue, follower count, conversion rate). The channel is mentioned only as context ' +
          'for the marketing achievement.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'website', 'web page', 'social media', 'Instagram', 'TikTok',
        'online presence', 'brand', 'logo', 'domain', 'hosting',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'ent_financial_details',
      pattern: 'Knows specific financial metrics from memory — margins, unit costs, break-even',
      whyItProves:
        'Only someone actually running a business knows their margins, cost per unit, or break-even ' +
        'point. These are not numbers you guess — they come from tracking expenses, pricing experiments, ' +
        'and spreadsheet time. Financial fluency is the clearest fingerprint of a real operator.',
      examples: [
        'Material cost $4.20/unit, selling price $15, break-even at 40 units/month — hit it in month 3',
        'Margin compressed from 60% to 42% when shipping costs rose; renegotiated carrier rate to recover to 51%',
        'CAC (customer acquisition cost) dropped from $8 to $2.50 after shifting from paid ads to SEO',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student runs a REAL business with real financial complexity. They are not playing ' +
        'entrepreneur — they understand the economics. This financial literacy will serve them in college.',
    },
    {
      id: 'ent_customer_conversations',
      pattern: 'References specific customer feedback, complaints, or requests',
      whyItProves:
        'Only someone with real customers hears real complaints. "Customers asked for larger sizes" ' +
        'or "got 3 refund requests that revealed a packaging problem" are details that cannot be ' +
        'fabricated because they come from actual business operations.',
      examples: [
        'After 5 customer complaints about shipping damage, redesigned packaging — damage rate dropped from 8% to 1%',
        'Customer survey revealed 70% wanted subscription option; launched monthly box, now 40% of revenue',
        'Repeat customer emailed that our product helped her classroom; became our first school bulk order ($800)',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student listens to customers and adapts. They have the humility and responsiveness ' +
        'that real entrepreneurs need. The customer stories prove the business has real relationships.',
    },
    {
      id: 'ent_failure_recovery',
      pattern: 'Describes specific failures, losses, or pivots and what was learned',
      whyItProves:
        'Resume-padders only report successes. Real entrepreneurs have failure stories because ' +
        'failure is inevitable. A student who can articulate what went wrong, why, and how they ' +
        'recovered demonstrates genuine operational experience and growth mindset.',
      examples: [
        'First product batch had 30% defect rate; found new manufacturer, implemented QC process, defects dropped to 2%',
        'Lost $800 on first pop-up event (overestimated demand); adjusted inventory model, next 4 events profitable',
        'Co-founder left after 3 months; reorganized responsibilities, shipped next feature update solo in 2 weeks',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has been through the fire of real entrepreneurship. Failure + recovery is the ' +
        'strongest proof of resilience. AOs value this narrative more than unbroken success stories.',
    },
    {
      id: 'ent_regulatory_navigation',
      pattern: 'Navigated real-world constraints — permits, regulations, taxes, insurance',
      whyItProves:
        'Dealing with business regulations is mundane but proves the venture is real. A student who ' +
        'mentions food handling permits, sales tax registration, or liability insurance operated in ' +
        'the real world, not just the classroom. These details are too boring to fabricate.',
      examples: [
        'Obtained food handler\'s permit and cottage food license to sell baked goods legally at farmers markets',
        'Registered LLC, set up bookkeeping system, filed quarterly sales tax — learned business compliance firsthand',
        'Navigated school district vendor approval process (took 3 months) to sell products in school store',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student dealt with real-world bureaucracy that most high schoolers never encounter. ' +
        'The administrative tedium proves the venture was serious enough to require it.',
    },
    {
      id: 'ent_supply_chain_knowledge',
      pattern: 'References specific supplier relationships, sourcing decisions, or logistics challenges',
      whyItProves:
        'Supply chain details are the kind of operational knowledge that only comes from actually ' +
        'making and selling physical products. Knowing your supplier\'s lead time, MOQ (minimum ' +
        'order quantity), or shipping costs proves hands-on business operation.',
      examples: [
        'Switched from domestic to overseas supplier after comparing 7 vendors; cut material cost 35% with same quality',
        'Managed inventory across 3 storage locations; implemented just-in-time ordering to reduce waste',
        'Negotiated 30-day payment terms with suppliers after 6 months of on-time payments — improved cash flow significantly',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student understands the operational backbone of a real business. Supply chain management ' +
        'is unsexy but critical — mentioning it proves genuine business sophistication.',
    },
    {
      id: 'ent_market_research_evidence',
      pattern: 'Conducted real market research — surveys, interviews, competitive analysis',
      whyItProves:
        'Real market research involves talking to potential customers, not just googling competitors. ' +
        'A student who surveyed 100 potential customers or interviewed 20 small business owners ' +
        'before building has genuine entrepreneurial discipline.',
      examples: [
        'Surveyed 200 students before building; discovered 73% would pay for a scheduling tool but not a study tool',
        'Interviewed 15 local restaurant owners; identified online ordering as top unmet need',
        'Analyzed 8 competitors, identified that none served the under-$10 price point — positioned there and captured 200 customers in 3 months',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student did not just build what they wanted — they researched what the market needed. ' +
        'This disciplined approach to entrepreneurship signals intellectual maturity.',
    },
    {
      id: 'ent_scaling_challenge',
      pattern: 'Describes specific scaling challenges and how they were solved',
      whyItProves:
        'Scaling problems only exist if the business grew. A student who describes hitting capacity ' +
        'limits, needing to hire, or redesigning processes for volume has a venture that outgrew ' +
        'its initial setup — proof of real traction and growth.',
      examples: [
        'Orders exceeded personal capacity at 30/week; hired 2 part-time packers, built assembly instructions',
        'Server crashed at 500 concurrent users; migrated to scalable hosting, handled 2,000 by month end',
        'Manual scheduling for 50 clients became unsustainable; built automated booking system, capacity tripled',
      ],
      expertiseLevel: 'expert',
      aoInterpretation:
        'This student hit real scaling challenges — the kind of problem most student "startups" never ' +
        'encounter because they never get enough traction. Growth pain is the most enviable problem.',
    },
    {
      id: 'ent_legal_structure',
      pattern: 'Made deliberate decisions about business structure based on actual needs',
      whyItProves:
        'Choosing between LLC and sole proprietorship, deciding on partnership agreements, or ' +
        'setting up a fiscal sponsor for a nonprofit shows the student thought about business ' +
        'fundamentals, not just the product. These decisions only matter for real ventures.',
      examples: [
        'Formed LLC after revenue exceeded hobby threshold; set up business banking and separate accounting',
        'Structured as B Corp to align legal obligations with social mission; attracted impact-focused investors',
        'Created partnership agreement with co-founder defining equity split, responsibilities, and exit terms',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student understands business structure, not just business activity. Making deliberate ' +
        'structural decisions shows the kind of forward-thinking that AOs associate with mature leaders.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'ent_transform_title_to_traction',
      transformType: 'name_drop_to_impact',
      before: 'Founder and CEO of an EdTech startup',
      after: 'Built learning tool used by 1,200 students at 8 schools; avg test score improvement of 15%',
      explanation:
        'Title ("Founder and CEO") is listed in the position field. The description should be ' +
        'evidence. "EdTech startup" is a label; "1,200 students at 8 schools" is proof.',
      charsBefore: 41,
      charsAfter: 87,
      principle: 'Traction is the only title that matters',
    },
    {
      id: 'ent_transform_tech_to_users',
      transformType: 'jargon_to_outcome',
      before: 'Developed full-stack app using React, Node.js, Express, and PostgreSQL',
      after: 'Built scheduling app: 2,000 users, saved 5 hrs/week per team; adopted by 12 sports organizations',
      explanation:
        'No AO cares about your tech stack. They care about who uses your product and what ' +
        'value it provides. Technology names → user count + value delivered + adoption.',
      charsBefore: 65,
      charsAfter: 93,
      principle: 'AOs evaluate WHAT you built, not HOW you coded it',
    },
    {
      id: 'ent_transform_idea_to_execution',
      transformType: 'claim_to_evidence',
      before: 'Created innovative solution to help students with college applications',
      after: 'Platform matched 300 students with essay reviewers; 92% reported feeling more confident, 40 accepted to top-50 schools',
      explanation:
        '"Innovative solution" is a claim anyone can make. The transformation shows what the ' +
        'solution IS (matching platform), how many used it (300), and what happened (92% confidence, ' +
        '40 top-50 acceptances). Evidence > claims.',
      charsBefore: 63,
      charsAfter: 112,
      principle: 'Ideas are free; execution is earned — show the execution',
    },
    {
      id: 'ent_transform_buzzwords_to_metrics',
      transformType: 'name_drop_to_impact',
      before: 'Leveraging AI and machine learning to disrupt the tutoring industry',
      after: 'Adaptive tutoring app: 600 users, personalized practice led to avg 22% score improvement in 8 weeks',
      explanation:
        'Buzzwords ("leveraging AI", "disrupt") are claims without evidence. ' +
        'The transformation describes the actual product and its measured impact. ' +
        'If AI is the method, the result is what matters.',
      charsBefore: 65,
      charsAfter: 95,
      principle: 'Buzzwords are noise; metrics are signal',
    },
    {
      id: 'ent_transform_plan_to_action',
      transformType: 'duty_to_achievement',
      before: 'Developed business plan and pitch deck for sustainable clothing line',
      after: 'Sold 300 upcycled garments ($5K revenue); featured at 4 local markets, 70% repeat customer rate',
      explanation:
        'Plans and decks are prerequisites, not achievements. The transformation skips ' +
        'to what HAPPENED: sales, revenue, market presence, and customer loyalty.',
      charsBefore: 62,
      charsAfter: 93,
      principle: 'Skip the planning; show the doing',
    },
    {
      id: 'ent_transform_passive_launch_to_growth',
      transformType: 'passive_to_active',
      before: 'Launched an app that was designed to help people find local events',
      after: 'App connects 4,500 users to local events; 200+ events listed monthly, used by 6 community orgs as primary platform',
      explanation:
        '"Launched" and "designed to" are passive and aspirational. The transformation shows ' +
        'current state: active users, content volume, and institutional adoption.',
      charsBefore: 63,
      charsAfter: 107,
      principle: 'Replace launch day with current traction',
    },
    {
      id: 'ent_transform_social_to_evidence',
      transformType: 'generic_to_specific',
      before: 'Social enterprise focused on bridging the digital divide in underserved communities',
      after: 'Refurbished and donated 400 laptops to 8 Title I schools; taught digital literacy to 200 parents',
      explanation:
        '"Social enterprise focused on bridging the digital divide" is a mission statement, not a ' +
        'description. The transformation shows what was actually DONE: specific quantity (400 laptops), ' +
        'specific recipients (8 schools), and specific additional action (taught 200 parents).',
      charsBefore: 77,
      charsAfter: 92,
      principle: 'Mission statements belong on websites, not in activity descriptions',
    },
    {
      id: 'ent_transform_funding_to_context',
      transformType: 'generic_to_specific',
      before: 'Successfully raised funding to support and grow the business',
      after: 'Won $3K at regional pitch competition; reinvested to triple inventory, revenue grew 4x next quarter',
      explanation:
        'Vague funding claims create suspicion. The transformation specifies the source (competition win), ' +
        'the context (regional, competitive), what it enabled (triple inventory), and the result (4x revenue).',
      charsBefore: 55,
      charsAfter: 96,
      principle: 'Every dollar needs an origin story',
    },
    {
      id: 'ent_transform_team_to_management',
      transformType: 'generic_to_specific',
      before: 'Worked with a team to build and grow the company',
      after: 'Managed 5-person team: weekly standups, code reviews, shipped 12 features in 6 months, grew users 300%',
      explanation:
        '"Worked with a team" is invisible leadership. The transformation shows management practices ' +
        '(standups, reviews), output (12 features), and result (300% user growth).',
      charsBefore: 49,
      charsAfter: 98,
      principle: 'Show how you managed, not just that you did',
    },
    {
      id: 'ent_transform_generic_impact_to_specific',
      transformType: 'claim_to_evidence',
      before: 'Made a positive impact on the community through my business',
      after: 'Employed 4 students part-time ($12K paid in wages); donated 10% of profits to local food bank ($800)',
      explanation:
        '"Positive impact" is an empty claim. The transformation lists two specific impacts — job creation ' +
        '(4 employees, $12K wages) and community giving (10% of profits, $800) — each with numbers.',
      charsBefore: 55,
      charsAfter: 98,
      principle: 'Impact without numbers is opinion; impact with numbers is fact',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'built', 'launched', 'scaled', 'sold', 'secured',
        'negotiated', 'acquired', 'pivoted', 'grew', 'generated',
      ],
      context:
        'In entrepreneurship, power verbs demonstrate EXECUTION and RESULTS. AOs respond to verbs ' +
        'that prove something was created and that it succeeded in the market. These verbs are ' +
        'outcomes-oriented — they imply that something measurable happened.',
      exampleUsage: 'Scaled tutoring platform to 8 schools and $12K annual revenue in under 2 years',
    },
    {
      tier: 'standard',
      verbs: [
        'designed', 'developed', 'managed', 'organized', 'created',
        'implemented', 'established', 'operated', 'hired', 'marketed',
      ],
      context:
        'Standard verbs in entrepreneurship show competence and activity but do not on their ' +
        'own convey market validation. "Designed" is building; "sold" is validation. These verbs ' +
        'are fine as supporting language but should be paired with results.',
      exampleUsage: 'Designed and implemented inventory management system for online store with 200+ SKUs',
    },
    {
      tier: 'weak',
      verbs: [
        'started', 'attempted', 'tried', 'explored', 'brainstormed',
        'envisioned', 'conceptualized', 'aspired', 'planned', 'hoped',
      ],
      context:
        'Weak verbs in entrepreneurship signal that the work stayed at the IDEA level. They convey ' +
        'intent without execution. "Started a business" says nothing about its outcome. "Planned" ' +
        'and "envisioned" are pre-work verbs — the real entrepreneurship happens after the planning.',
      exampleUsage: 'Started a small business (vs. "Built candle business: $6K revenue, 400 customers, 3 retail partnerships")',
    },
  ],

  roleExpertise: [
    {
      role: 'Solo Founder / Owner',
      expectedSignals: [
        'Full ownership of all business functions (product, marketing, sales, operations)',
        'Revenue or user metrics demonstrating market validation',
        'Specific product or service with identifiable customers',
        'Time investment that goes beyond a weekend project',
      ],
      differentiators: [
        'Revenue exceeding $5K or users exceeding 1,000',
        'External validation (competitions, press, accelerators)',
        'Hire of employees or contractors (business outgrew one person)',
        'Multi-year commitment with growth trajectory',
        'Customer retention or repeat purchase metrics',
      ],
      overclaimingRisks: [
        'Using "CEO" title for a solo operation with no employees',
        'Inflating revenue figures (AOs may verify in interviews)',
        'Claiming "startup" for a small craft/resale operation',
        'Taking credit for results driven by parental financial backing',
      ],
      authenticPatterns: [
        'References specific challenges (supply issues, customer complaints, cash flow)',
        'Knows financial details from memory (margins, costs, break-even)',
        'Describes growth in specific terms with dates and milestones',
        'Mentions what they would do differently (retrospective thinking)',
      ],
    },
    {
      role: 'Co-Founder / Partner',
      expectedSignals: [
        'Clear ownership of specific business functions (not just "helped with everything")',
        'Complementary skills to co-founder(s) with defined roles',
        'Decision-making authority in their domain',
        'Shared accountability for outcomes',
      ],
      differentiators: [
        'Built the team — recruited co-founders with complementary skills',
        'Navigated co-founder disagreements or conflicts productively',
        'Specific metrics in their domain of responsibility',
        'Vision-setting or strategic pivots they drove',
      ],
      overclaimingRisks: [
        'Taking sole credit for shared achievements',
        'Using "co-founder" when they were a team member assigned by a teacher',
        'Overstating their role relative to partners who did more',
        'Claiming leadership of the overall venture when they ran one function',
      ],
      authenticPatterns: [
        'Clearly delineates their contribution vs. partner contributions',
        'References how the team divided responsibilities',
        'Describes a specific decision or initiative they personally drove',
        'Acknowledges what they learned from working with partners',
      ],
    },
    {
      role: 'Freelancer / Consultant',
      expectedSignals: [
        'Specific client list with identifiable work products',
        'Revenue or project volume demonstrating sustained client demand',
        'Skill development visible through the progression of projects',
        'Client retention or referral evidence',
      ],
      differentiators: [
        'Built a client pipeline through reputation (not just family contacts)',
        'Raised rates over time as skills improved',
        'Handled complex client management (deadlines, revisions, scope)',
        'Created portfolio or case studies of completed work',
      ],
      overclaimingRisks: [
        'Calling occasional gig work a "consulting business"',
        'Inflating client count or project scope',
        'Claiming professional-level rates for student-quality work',
        'Presenting school assignments as freelance projects',
      ],
      authenticPatterns: [
        'References specific projects with outcomes for the client',
        'Mentions client feedback or repeat engagement',
        'Describes skill growth through the progression of projects',
        'Knows pricing, project management, and client communication details',
      ],
    },
    {
      role: 'E-commerce / Product Seller',
      expectedSignals: [
        'Specific products with identifiable customer base',
        'Revenue and unit sales figures',
        'Sales channel strategy (online, markets, retail partnerships)',
        'Product development or sourcing process',
      ],
      differentiators: [
        'Developed original products (not just reselling)',
        'Built brand identity that attracted organic customers',
        'Managed production at scale (not just one-off crafts)',
        'Secured retail partnerships or wholesale accounts',
        'Year-over-year growth with increasing complexity',
      ],
      overclaimingRisks: [
        'Calling Depop/Poshmark reselling a "fashion brand"',
        'Inflating revenue by counting gross before costs',
        'Presenting parent-funded inventory as self-started business',
        'Counting unsold inventory as revenue potential',
      ],
      authenticPatterns: [
        'Knows cost of goods, margins, and pricing strategy',
        'References specific production or sourcing challenges',
        'Describes marketing experiments and what worked',
        'Tracks sales data and can cite specific numbers',
      ],
    },
    {
      role: 'App / Platform Developer',
      expectedSignals: [
        'Working product that can be used or demonstrated',
        'User metrics (downloads, active users, retention)',
        'Iteration based on user feedback',
        'Technical execution beyond a tutorial project',
      ],
      differentiators: [
        'Significant user adoption (1,000+ users)',
        'Revenue or institutional adoption',
        'Solved a problem no existing solution addressed',
        'Maintained and updated over 6+ months',
        'Community of users who actively provide feedback',
      ],
      overclaimingRisks: [
        'Calling a class project a "platform"',
        'Listing technology stack as the achievement',
        'Claiming "AI-powered" for basic rule-based features',
        'Presenting a prototype as a launched product',
      ],
      authenticPatterns: [
        'References specific user feedback and how it shaped features',
        'Describes technical challenges and creative solutions',
        'Knows user metrics and engagement patterns',
        'Mentions maintenance, bug fixes, and updates (not just building)',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Named accelerator or incubator acceptance',
      whyItsTheException:
        'Acceptance into Y Combinator, Techstars, MassChallenge, or other recognized programs ' +
        'IS the achievement. These programs have single-digit acceptance rates and rigorous vetting. ' +
        'The program name communicates selectivity and validation instantly.',
      example: 'Accepted into Y Combinator Startup School (top 3% of applicants); built app to 2,000 users during the program',
    },
    {
      pattern: 'Specific revenue milestone that contextualizes the business',
      whyItsTheException:
        'Dollar amounts ARE the jargon of business, and they are universally understood. ' +
        '"$12K revenue" communicates more in 3 words than any description of the business model. ' +
        'Financial metrics are the one "technical" detail AOs always understand.',
      example: '$12K first-year revenue from 400+ customers; reinvested profits to triple inventory for Year 2',
    },
    {
      pattern: 'Named competition or award with competitive context',
      whyItsTheException:
        'Competition names with context ("DECA State Champion from 500 entries") combine the ' +
        'brand recognition of the competition with the selectivity of the achievement. The name ' +
        'anchors the accomplishment in a known framework.',
      example: 'DECA International Career Development Conference finalist; top 5 from 200,000+ participants globally',
    },
    {
      pattern: 'Specific platform metrics that prove scale (App Store rank, Shopify data)',
      whyItsTheException:
        'Platform-specific metrics like "Top 50 in App Store Education category" or "Shopify ' +
        'store with 4.9/5 across 200 reviews" leverage well-known platforms to contextualize ' +
        'achievement. AOs understand these benchmarks even if they are not technical.',
      example: 'Ranked #47 in App Store Education category; 8,000 downloads, 4.7-star rating from 350 reviews',
    },
    {
      pattern: 'Patents that were actually GRANTED (not just filed)',
      whyItsTheException:
        'A granted patent (not "pending") means the USPTO reviewed the invention and determined ' +
        'it was novel. This is genuine external validation of innovation. The patent number is ' +
        'proof that cannot be inflated.',
      example: 'Granted US Patent #X,XXX,XXX for novel water filtration method; device deployed in 3 developing communities',
    },
  ],
};
