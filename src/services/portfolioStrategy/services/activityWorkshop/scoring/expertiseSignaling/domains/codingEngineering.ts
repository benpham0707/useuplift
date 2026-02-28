/**
 * Coding & Engineering Expertise Domain
 *
 * Covers software projects, apps, websites, robotics hardware, hackathon
 * builds, open-source contributions, and hardware/maker projects.
 *
 * Key insight: This is the domain where name-dropping is most tempting
 * and most destructive. Students list tech stacks like resumes for a job
 * interview, but AOs are not hiring engineers — they are evaluating
 * intellectual curiosity, initiative, and impact. "Built with React,
 * Node, MongoDB, AWS" wastes 35 characters that could describe who the
 * product helps and why it matters.
 *
 * The critical distinction: AOs care about WHAT you built and WHO it
 * helped, not HOW you built it. The technology stack is invisible to
 * non-technical readers. The problem solved is universal.
 *
 * Sources: MIT admissions blog on maker activities, Stanford CS
 * department on distinguishing projects, Y Combinator application
 * patterns (what VCs look for maps to what AOs look for), published
 * AO panels on tech activities, NACAC 2024.
 */

import type { ExpertiseDomain } from '../types';

export const CODING_ENGINEERING_DOMAIN: ExpertiseDomain = {
  domainId: 'coding_engineering',
  label: 'Coding & Engineering',
  overview:
    'Software projects, apps, websites, robotics, hackathon builds, open-source ' +
    'contributions, and hardware/maker projects. The most name-drop-prone category after ' +
    'STEM research. Students confuse listing technologies with demonstrating competence. ' +
    'AOs evaluate these activities on the same criteria as everything else: problem ' +
    'identification, initiative, impact, and growth. The code is invisible — only the ' +
    'product and its impact are legible.',

  aoExpectations: {
    whatRegisters: [
      'A clear problem that the student identified and chose to solve — showing initiative and empathy, not just technical skill',
      'Real users, real deployment, real impact: "1,200 monthly users" or "adopted by 3 schools" proves the project matters',
      'Iteration based on feedback: "redesigned after user testing" shows maturity and user-centered thinking',
      'Sustained commitment: a project maintained over months/years signals genuine investment, not a weekend experiment',
      'Community impact: building for others (nonprofits, underserved communities, school) demonstrates character',
      'Open-source contributions to real projects: shows ability to work in professional codebases and collaborate with strangers',
    ],
    whatAOsSeeThrough: [
      'Technology stack listings ("Built with React, Node.js, MongoDB, AWS") — AOs do not know or care what these are',
      '"AI-powered" or "ML-driven" as meaningless qualifiers on projects that are actually simple CRUD apps',
      'Apps and websites with no users, no deployment, and no evidence anyone besides the creator has seen them',
      'Class projects dressed up as independent ventures — the framing is usually transparent',
      'Listing programming languages known as if they are achievements ("Proficient in Python, Java, C++, JavaScript")',
      '"Full-stack developer" as a self-assigned title without evidence of full-stack work',
    ],
    goldenQuestion:
      'If this student never built this, would anyone notice? Does this project solve ' +
      'a real problem for real people, or is it a technical exercise that exists only on ' +
      'the student\'s resume?',
    readingTimeContext:
      'AOs spend 8-12 seconds on each activity description. A tech stack listing ("React, ' +
      'Node, MongoDB, Express, AWS, Docker") consumes 4+ seconds of reading time and ' +
      'communicates nothing. Lead with the PROBLEM and IMPACT — these are universally ' +
      'understood regardless of technical background.',
    competitiveContext:
      'At tech-focused schools (MIT, Stanford, CMU), 40-50% of applicants list coding projects. ' +
      'At Ivies, ~15-25% do. The differentiator is NEVER the technology used — it is the ' +
      'problem solved, the users served, and the maturity of the approach. A simple website ' +
      'that 500 people actually use beats a complex ML project that nobody has seen.',
  },

  realExpertiseSignals: [
    {
      id: 'ce_real_users',
      pattern: 'user_metrics',
      description:
        'Student quantifies actual usage: monthly active users, downloads, customers, ' +
        'or organizations using the product.',
      whyItWorks:
        'Real users are the ultimate validation of a software project. "1,200 monthly users" ' +
        'is impossible to fake and immediately separates a real product from a class project. ' +
        'AOs understand user numbers even without technical knowledge — they are a universal ' +
        'measure of whether something matters.',
      examples: [
        '1,200 monthly active users across 3 schools — automated attendance tracking',
        'Chrome extension: 5,000+ installs, 4.7-star rating, featured in school district newsletter',
        'App adopted by 2 local nonprofits; processes 300+ volunteer sign-ups monthly',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'users', 'downloads', 'installs', 'active', 'monthly',
        'daily', 'adopted', 'deployed', 'customers', 'organizations',
        'rating', 'reviews', 'sign-ups',
      ],
    },
    {
      id: 'ce_problem_specificity',
      pattern: 'problem_identification',
      description:
        'Student describes a specific, real-world problem they identified and chose to solve, ' +
        'demonstrating empathy and initiative.',
      whyItWorks:
        'The most impressive thing about a coding project is not the code — it is the problem ' +
        'identification. A student who noticed that their school\'s scheduling system was broken ' +
        'and decided to fix it demonstrates the combination of observation, empathy, and initiative ' +
        'that AOs prize. The problem tells the AO about the student\'s values and awareness.',
      examples: [
        'Noticed school counselors spent 40 hrs/month on manual scheduling — built tool that automates it',
        'After grandmother struggled with telehealth, built simplified video call app for elderly users',
        'Local food bank tracked inventory on paper — built web app, reducing waste by 30%',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'noticed', 'realized', 'identified', 'saw that', 'problem',
        'needed', 'struggled', 'inefficient', 'manual', 'broken',
        'built', 'created', 'developed', 'solved',
      ],
    },
    {
      id: 'ce_iteration_feedback',
      pattern: 'user_centered_iteration',
      description:
        'Student describes iterating on their product based on user feedback, usability ' +
        'testing, or real-world usage data.',
      whyItWorks:
        'Most student projects are "build it and forget it." A student who describes redesigning ' +
        'their UI after user testing, or adding features based on feedback from a nonprofit partner, ' +
        'demonstrates the mature, user-centered approach that distinguishes real products from ' +
        'portfolio pieces.',
      examples: [
        'Redesigned navigation after 15-user usability study — task completion time dropped 60%',
        'Food bank partner requested inventory alerts; added SMS notification feature in v2',
        'User analytics showed 70% mobile traffic — rebuilt responsive design, engagement increased 2x',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'redesigned', 'iterated', 'feedback', 'user testing', 'usability',
        'v2', 'version', 'updated', 'improved based on', 'user research',
        'analytics', 'responded to', 'added feature',
      ],
    },
    {
      id: 'ce_deployment_reality',
      pattern: 'production_deployment',
      description:
        'Student describes actually deploying and maintaining a product in production — ' +
        'handling real traffic, uptime, security, and ongoing support.',
      whyItWorks:
        'Deploying a project is orders of magnitude harder than building it locally. A student ' +
        'who has dealt with production issues — server crashes, security patches, scaling ' +
        'problems — has crossed the threshold from "student who codes" to "developer who ships." ' +
        'This operational experience is rare and highly valued.',
      examples: [
        'Deployed to AWS; maintained 99.5% uptime over 8 months with automated monitoring',
        'Published to App Store — managed 3 release cycles based on crash reports and user reviews',
        'Production system processes 2,000 requests/day; built rate limiting after detecting abuse attempts',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'deployed', 'production', 'live', 'uptime', 'maintained',
        'released', 'published', 'app store', 'launched', 'hosting',
        'server', 'monitoring', 'scaling',
      ],
    },
    {
      id: 'ce_open_source',
      pattern: 'open_source_contribution',
      description:
        'Student contributes to established open-source projects — not just creating a repo, ' +
        'but engaging with maintainers, submitting PRs, and working in professional codebases.',
      whyItWorks:
        'Open-source contribution requires reading and understanding unfamiliar code, following ' +
        'project conventions, communicating with maintainers, and having your work reviewed by ' +
        'professionals. It is the closest analog to professional software development available ' +
        'to high school students. Every merged PR is proof of professional-level competence.',
      examples: [
        'Contributed 12 PRs to Mozilla Firefox — fixed accessibility bugs affecting screen reader users',
        'Open-source npm package: 200+ GitHub stars, used by 50+ projects, 15K weekly downloads',
        'Maintainer of open-source library for data visualization — 8 contributors, adopted by 3 universities',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'open source', 'open-source', 'GitHub', 'PR', 'pull request',
        'contributor', 'maintainer', 'stars', 'forks', 'npm',
        'PyPI', 'package', 'library', 'merged',
      ],
    },
    {
      id: 'ce_technical_decision',
      pattern: 'architecture_decision',
      description:
        'Student explains a specific technical decision and WHY they made it — choosing ' +
        'a database, an architecture pattern, or a technology for specific reasons.',
      whyItWorks:
        'Students who just follow tutorials do not make architectural decisions — they use ' +
        'whatever the tutorial uses. A student who writes "chose serverless to handle variable ' +
        'traffic without fixed costs" demonstrates the engineering judgment that separates a ' +
        'builder from a tutorial-follower.',
      examples: [
        'Chose serverless architecture to handle 10x traffic spikes during school registration without fixed hosting costs',
        'Built offline-first to serve rural areas with poor connectivity — syncs when connected',
        'Selected PostgreSQL over MongoDB for relational data integrity in financial tracking app',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'chose', 'selected', 'because', 'tradeoff', 'architecture',
        'decision', 'designed', 'approach', 'instead of', 'over',
        'optimized for', 'prioritized',
      ],
    },
    {
      id: 'ce_quantified_impact',
      pattern: 'measurable_outcome',
      description:
        'Student quantifies the specific impact of their project — time saved, errors reduced, ' +
        'money saved, efficiency improved.',
      whyItWorks:
        'Quantified impact transforms "I built a thing" into "I solved a problem that mattered." ' +
        '"Automated 40-hour/month manual process" tells AOs the project was valuable. ' +
        '"Reduced data entry errors by 85%" shows the project actually worked. Numbers make ' +
        'claims verifiable and credible.',
      examples: [
        'Automated 40 hrs/month of manual scheduling — counselors redirected time to student meetings',
        'Reduced food waste 30% at local food bank by predicting donation patterns',
        'Cut volunteer coordination time from 3 hours to 15 minutes per event',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'reduced', 'saved', 'automated', 'improved', 'increased',
        'hours', 'minutes', 'percent', '%', 'efficiency',
        'eliminated', 'streamlined', 'cut', 'decreased',
      ],
    },
    {
      id: 'ce_sustained_maintenance',
      pattern: 'long_term_commitment',
      description:
        'Student describes maintaining and improving a project over months or years, not ' +
        'just building and abandoning it.',
      whyItWorks:
        'Building a project takes days. Maintaining it takes months. A student who has been ' +
        'maintaining a project for a year+ has dealt with bugs, feature requests, technical ' +
        'debt, and evolving requirements. This sustained commitment proves the project matters ' +
        'and the student is genuinely invested.',
      examples: [
        '18 months of active development; 200+ commits, 15 feature releases',
        'Maintained school app through 3 academic years — onboarded 2 student developers to continue after graduation',
        'Weekly updates for 14 months based on teacher feedback — now used school-wide',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'maintained', 'ongoing', 'continued', 'months', 'years',
        'releases', 'updates', 'versions', 'commits', 'long-term',
        'sustained', 'active development',
      ],
    },
    {
      id: 'ce_teaching_others',
      pattern: 'knowledge_transfer',
      description:
        'Student teaches coding to others — running workshops, creating tutorials, mentoring ' +
        'beginners, or building educational tools.',
      whyItWorks:
        'Teaching coding demonstrates mastery (you must understand deeply to explain clearly), ' +
        'initiative (choosing to help others), and impact (measurable skill transfer). AOs value ' +
        'this triple signal highly. A student who taught 30 classmates to code and 5 built their ' +
        'own projects is contributing to their community.',
      examples: [
        'Taught coding to 30 middle schoolers in weekly workshops; 5 built and deployed their own websites',
        'Created YouTube tutorial series on web development — 8K subscribers, 100K+ total views',
        'Mentored 8 students through first hackathon; 3 won prizes at their next competition',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'taught', 'mentored', 'workshops', 'tutorials', 'training',
        'students', 'beginners', 'curriculum', 'course', 'lesson',
        'subscribers', 'viewers',
      ],
    },
    {
      id: 'ce_revenue_or_business',
      pattern: 'entrepreneurial_validation',
      description:
        'Student generated revenue, secured paying customers, or built a sustainable business ' +
        'model around their technical project.',
      whyItWorks:
        'Revenue is the ultimate validation signal. It means someone valued the product enough ' +
        'to pay for it. Even modest revenue ($500/month) demonstrates that the student built ' +
        'something genuinely useful, not just a portfolio piece. Entrepreneurial validation ' +
        'shows real-world competence beyond coding.',
      examples: [
        'SaaS tool for small restaurants: $800/month recurring revenue from 12 paying customers',
        'Freelance web development: built 8 client websites, earned $4,500 over summer',
        'Sold 3 custom automation tools to local businesses; each saves 10+ hours/week of manual work',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'revenue', 'paying', 'customers', 'clients', 'earned',
        'sold', 'business', 'SaaS', 'subscription', 'freelance',
        'income', 'profit', 'commercial',
      ],
    },
    {
      id: 'ce_hardware_integration',
      pattern: 'physical_world_connection',
      description:
        'Student describes projects that connect software to the physical world — ' +
        'IoT devices, robotics, sensor networks, hardware prototyping.',
      whyItWorks:
        'Hardware-software integration is significantly harder than pure software. ' +
        'It requires understanding electronics, physical constraints, reliability in ' +
        'real-world conditions, and debugging across abstraction layers. A student who ' +
        'built "a sensor network monitoring 4 beehives" has dealt with weather, power, ' +
        'connectivity, and calibration challenges that pure coders never face.',
      examples: [
        'Built IoT sensor network monitoring 4 beehives; data predicted swarm events 3 days in advance',
        'Designed and 3D-printed prosthetic hand with Arduino servo control — fitted for local amputee',
        'Built automated greenhouse: sensors, actuators, and ML-based watering — reduced water usage 45%',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'sensor', 'IoT', 'Arduino', 'Raspberry Pi', 'hardware',
        'circuit', 'PCB', '3D print', 'robot', 'motor', 'servo',
        'embedded', 'firmware', 'wired', 'physical',
      ],
    },
    {
      id: 'ce_security_awareness',
      pattern: 'security_mindset',
      description:
        'Student references security considerations in their project — data protection, ' +
        'authentication, input validation, or responsible disclosure.',
      whyItWorks:
        'Security awareness is rare among student developers and signals professional maturity. ' +
        'A student who writes "implemented end-to-end encryption for student data" or "discovered ' +
        'and responsibly disclosed XSS vulnerability" demonstrates thinking beyond features — ' +
        'they are considering consequences.',
      examples: [
        'Implemented HIPAA-compliant data handling for health app — encrypted all patient data at rest and in transit',
        'Discovered and responsibly disclosed SQL injection vulnerability in school website; helped IT team patch it',
        'Built authentication system with OAuth2 and role-based access control for multi-school deployment',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'security', 'encryption', 'authentication', 'vulnerability',
        'privacy', 'data protection', 'HIPAA', 'compliance', 'secure',
        'responsible disclosure', 'patch', 'OAuth',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'ce_tech_stack',
      pattern: 'Technology stack listing (React/Node/MongoDB/AWS)',
      whyStudentsUseIt:
        'Students model their activity descriptions on job resumes and LinkedIn profiles. ' +
        'In the job market, tech stacks matter for keyword matching. Students assume the same ' +
        'logic applies to college applications.',
      whyItFails:
        'AOs are not hiring engineers. They do not know what React, Node.js, or MongoDB are, ' +
        'and they do not care. A tech stack listing wastes 30-50 characters communicating ' +
        'nothing to the actual reader. Worse, it signals that the student thinks tools are ' +
        'more important than outcomes — exactly the wrong priority for college.',
      betterAlternative:
        'Delete the entire tech stack and use those characters to describe the PROBLEM solved ' +
        'and the IMPACT achieved. The technology is implied by the sophistication of the product.',
      example: {
        nameDrop:
          'Built full-stack web application using React, Node.js, MongoDB, and deployed on AWS',
        improved:
          'Built scheduling platform for 3 schools; 800+ students use it weekly — eliminated double-booking conflicts',
        whatChanged:
          'Removed 43 characters of tech stack. Added user base (800+ students), scope (3 schools), ' +
          'specific problem solved (double-booking), and cadence of use (weekly). AO now understands ' +
          'the product\'s value to real people.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 43,
      detectionKeywords: [
        'React', 'Node', 'MongoDB', 'AWS', 'Express', 'PostgreSQL',
        'MySQL', 'Firebase', 'Docker', 'Kubernetes', 'TypeScript',
        'JavaScript', 'full-stack', 'built with', 'tech stack',
        'framework', 'backend', 'frontend',
      ],
    },
    {
      id: 'ce_ai_powered',
      pattern: '"AI-powered" / "ML-driven" / "uses artificial intelligence"',
      whyStudentsUseIt:
        'AI is the most culturally prominent technology of the decade. Students believe ' +
        'labeling anything "AI-powered" makes it sound cutting-edge and impressive.',
      whyItFails:
        '"AI-powered" has become the "synergy" of student project descriptions — a meaningless ' +
        'buzzword that signals hype over substance. Most "AI-powered" student projects use a ' +
        'pre-built API call or a basic classifier. AOs cannot distinguish genuine ML innovation ' +
        'from an API wrapper, and they know it. The label creates suspicion, not credibility.',
      betterAlternative:
        'Describe what the AI DOES in human terms. "AI-powered essay helper" becomes ' +
        '"Provides specific feedback on essay structure and evidence quality." The intelligence ' +
        'is demonstrated by the capability, not claimed by a label.',
      example: {
        nameDrop:
          'Developed AI-powered application using machine learning to help students study more effectively',
        improved:
          'Built study tool that predicts which topics each student will struggle with — 85% accuracy, used by 200 students',
        whatChanged:
          'Removed "AI-powered" and "machine learning" (26 chars of buzzwords). Added specific ' +
          'capability (predicts struggle topics), performance metric (85% accuracy), and user base ' +
          '(200 students). The reader can now evaluate the actual value.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 26,
      detectionKeywords: [
        'AI-powered', 'AI-driven', 'ML-driven', 'artificial intelligence',
        'machine learning', 'deep learning', 'neural network', 'uses AI',
        'powered by AI', 'intelligent', 'smart',
      ],
    },
    {
      id: 'ce_programming_languages',
      pattern: 'Programming language listing as achievement',
      whyStudentsUseIt:
        'Students conflate "languages I know" with "skills I have." Listing 5+ languages ' +
        'feels like evidence of breadth and versatility. The computer science community ' +
        'reinforces this (e.g., GitHub language statistics).',
      whyItFails:
        'Programming languages are tools, not achievements. "Proficient in Python, Java, C++, ' +
        'JavaScript, and Swift" is like an artist saying "proficient in pencils, charcoal, ' +
        'pastels, oil paint, and watercolor" — it tells you nothing about what they create. ' +
        'AOs want to see what you BUILT, not what you built it WITH.',
      betterAlternative:
        'Name ONE thing you built and its impact. If language choice matters (e.g., chose C++ ' +
        'for performance-critical system), that is a technical decision worth mentioning. ' +
        'Otherwise, omit languages entirely.',
      example: {
        nameDrop:
          'Proficient in Python, Java, C++, JavaScript, HTML/CSS, SQL, and Swift',
        improved:
          'Built 4 deployed projects: school scheduling app (800 users), food bank inventory tracker, 2 open-source libraries (500+ stars combined)',
        whatChanged:
          'Replaced 7 language names (57 chars) with 4 specific products with metrics. ' +
          'Each project implies the relevant languages without naming them. The reader sees ' +
          'a portfolio of real work, not a list of tools.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 50,
      detectionKeywords: [
        'proficient in', 'experienced in', 'skilled in', 'know',
        'Python', 'Java', 'C++', 'JavaScript', 'Swift', 'HTML',
        'CSS', 'SQL', 'Ruby', 'Go', 'Rust', 'Kotlin',
        'programming languages', 'languages',
      ],
    },
    {
      id: 'ce_full_stack',
      pattern: '"Full-stack developer" / "Full-stack application"',
      whyStudentsUseIt:
        '"Full-stack" sounds professional and complete. Students use it to signal that they ' +
        'can handle both frontend and backend development, which they correctly understand ' +
        'is impressive in the job market.',
      whyItFails:
        'AOs do not know what "full-stack" means. To a non-technical reader, it is jargon that ' +
        'communicates nothing. Even if they looked it up, knowing that a student can build ' +
        'both the visible and invisible parts of a website tells them nothing about WHAT the ' +
        'website does or WHO it helps.',
      betterAlternative:
        'Describe the product and its impact. "Built full-stack application" becomes ' +
        '"Built platform connecting 50 volunteer tutors with 200 students across 4 schools."',
      example: {
        nameDrop:
          'Built full-stack web application with responsive design and RESTful API architecture',
        improved:
          'Built platform connecting 50 volunteer tutors with 200 students; 3,000+ sessions completed, avg grade improvement 0.8 GPA points',
        whatChanged:
          'Removed "full-stack," "responsive design," and "RESTful API" (all invisible to AOs). ' +
          'Added specific users (50 tutors, 200 students), scale (3,000+ sessions), and ' +
          'measurable outcome (0.8 GPA point improvement). The technology is invisible; ' +
          'the impact is unforgettable.',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'full-stack', 'full stack', 'fullstack', 'responsive',
        'RESTful', 'REST API', 'API', 'microservices', 'MVC',
        'SPA', 'single page',
      ],
    },
    {
      id: 'ce_app_or_website',
      pattern: '"Built an app" / "Created a website" without context',
      whyStudentsUseIt:
        'Students believe the act of building software is inherently impressive. ' +
        'To them, "I built an app" IS the achievement.',
      whyItFails:
        'In 2026, building a basic app or website is trivially easy with no-code tools, ' +
        'tutorials, and AI assistance. "Built an app" communicates nothing about difficulty, ' +
        'purpose, or impact. AOs have read thousands of "built an app" descriptions — they ' +
        'need to know WHAT the app does and WHY it matters.',
      betterAlternative:
        'Lead with the problem, then the solution, then the impact. ' +
        '"Built an app" becomes "Built [specific solution] that [specific impact] for [specific users]."',
      example: {
        nameDrop:
          'Created a mobile app for helping people with everyday tasks and productivity',
        improved:
          'Built habit-tracking app for ADHD students: customizable reminders + visual progress — 400 daily active users, 4.6 App Store rating',
        whatChanged:
          'Replaced vague "app for helping with tasks" with specific target audience (ADHD students), ' +
          'specific features (customizable reminders, visual progress), and strong metrics ' +
          '(400 daily users, 4.6 rating). The specificity makes it credible.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'built an app', 'created a website', 'developed an application',
        'made an app', 'designed a website', 'built a platform',
        'web app', 'mobile app', 'application',
      ],
    },
    {
      id: 'ce_framework_name',
      pattern: 'Framework/library name-drops (TensorFlow, Flutter, Next.js)',
      whyStudentsUseIt:
        'Students believe naming specific frameworks signals technical depth. In CS ' +
        'communities, framework choice is a meaningful topic. They assume AOs will ' +
        'be similarly impressed.',
      whyItFails:
        'Framework names are meaningless to AOs. "Built with Next.js and Tailwind CSS" ' +
        'is gibberish to a non-technical reader. Even "TensorFlow" — which has some cultural ' +
        'recognition — tells AOs nothing about WHAT was built. The framework is a means; ' +
        'the AO cares about the end.',
      betterAlternative:
        'Replace framework names with what the framework ENABLED you to build. ' +
        'If the framework choice was a genuine engineering decision, describe the tradeoff: ' +
        '"built offline-first for rural connectivity" instead of "used React Native."',
      example: {
        nameDrop:
          'Built mobile app using React Native, Firebase, and TensorFlow Lite for on-device ML inference',
        improved:
          'Built plant disease identifier for farmers: photograph a leaf, get diagnosis in 3 seconds — 92% accuracy, used by 3 farms',
        whatChanged:
          'Removed 3 framework names (41 chars). Added specific use case (plant disease), ' +
          'UX (photograph, 3 seconds), performance (92% accuracy), and real users (3 farms). ' +
          'A non-technical AO can now picture exactly what this does.',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'TensorFlow', 'PyTorch', 'Flutter', 'React Native', 'Next.js',
        'Django', 'Flask', 'Spring Boot', 'Tailwind', 'Bootstrap',
        'Vue', 'Angular', 'Svelte', 'Laravel', 'Rails',
      ],
    },
    {
      id: 'ce_github_stats',
      pattern: 'GitHub statistics without context',
      whyStudentsUseIt:
        'GitHub commits, streak days, and contribution graphs are gamified metrics ' +
        'that feel like proof of work. Students are proud of "500+ commits" or ' +
        '"365-day streak."',
      whyItFails:
        'GitHub commit counts are easily inflated (auto-formatting, dependency updates, ' +
        'empty commits). AOs do not know what GitHub is, let alone what commits mean. ' +
        'A "365-day streak" could be one-line changes every day. These metrics are noise ' +
        'to non-technical readers.',
      betterAlternative:
        'Replace GitHub stats with project-level metrics: users, deployments, contributions ' +
        'accepted by established open-source projects, or packages published.',
      example: {
        nameDrop:
          '500+ GitHub commits, 365-day contribution streak, 15 repositories',
        improved:
          '3 deployed projects with 2,000+ combined users; 2 open-source packages with 300+ GitHub stars from community developers',
        whatChanged:
          'Replaced vanity metrics (commits, streak, repos) with impact metrics ' +
          '(deployed projects, real users, community adoption). GitHub stars on ' +
          'open-source packages are meaningful because they represent genuine community ' +
          'validation, unlike commit counts.',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'commits', 'GitHub', 'repositories', 'repos', 'streak',
        'contribution graph', 'green squares', 'pull requests',
        'branches',
      ],
    },
    {
      id: 'ce_class_project_dress_up',
      pattern: 'Class project framed as independent project',
      whyStudentsUseIt:
        'Students want to claim every technical project they have done. Class assignments ' +
        'represent real work, and students feel it is unfair not to mention them.',
      whyItFails:
        'AOs can usually tell when a project was a class assignment — the scope, timing, and ' +
        'framing give it away. Dressing up homework as independent work damages credibility. ' +
        'If the class project was genuinely impressive, be honest about its origin — "Extended ' +
        'AP CS final project into production tool" is more credible than pretending it was ' +
        'independently conceived.',
      betterAlternative:
        'Either be honest about the origin ("Extended class project into...") or focus on ' +
        'what you did BEYOND the assignment. If you went far beyond the requirements, ' +
        'that is the story.',
      example: {
        nameDrop:
          'Independently developed a database management system and sorting algorithm visualization',
        improved:
          'Extended AP CS final project: turned sorting visualizer into teaching tool — adopted by CS teacher for 3 class sections',
        whatChanged:
          'Acknowledged the class origin (more credible) and added the extension beyond ' +
          'the assignment (adopted by teacher). The story of going beyond expectations ' +
          'is more compelling than pretending it was independent.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'independently developed', 'from scratch', 'on my own',
        'personal project', 'side project', 'self-directed',
        'database management', 'sorting algorithm',
      ],
    },
    {
      id: 'ce_buzzword_qualifier',
      pattern: '"Innovative" / "Revolutionary" / "Cutting-edge" self-description',
      whyStudentsUseIt:
        'Students use superlative adjectives to make their projects sound more impressive. ' +
        'They believe stronger language = stronger impression.',
      whyItFails:
        'Self-applied superlatives are the fastest way to lose credibility with AOs. ' +
        '"Innovative app" is a claim; "app used by 500 people" is evidence. AOs are trained ' +
        'to discount adjectives and look for nouns and numbers. Every "innovative" or ' +
        '"revolutionary" wastes 10-13 characters that could contain evidence.',
      betterAlternative:
        'Delete the adjective entirely. Replace it with a specific metric or fact. ' +
        'Let the reader conclude it is innovative from the evidence.',
      example: {
        nameDrop:
          'Developed innovative and cutting-edge solution for modernizing school communication systems',
        improved:
          'Built parent-teacher messaging platform: 90% read rate (vs 30% email); adopted by 4 schools, 2,000+ parents',
        whatChanged:
          'Removed "innovative and cutting-edge" (27 chars of empty claims). Added ' +
          'specific comparison (90% vs 30% email), adoption scope (4 schools), and user ' +
          'count (2,000+ parents). The numbers prove innovation without claiming it.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'innovative', 'revolutionary', 'cutting-edge', 'groundbreaking',
        'state-of-the-art', 'novel', 'unique', 'advanced', 'sophisticated',
        'disruptive', 'game-changing', 'breakthrough',
      ],
    },
    {
      id: 'ce_certification_list',
      pattern: 'Online certifications/courses listed as achievements',
      whyStudentsUseIt:
        'Students invest time in online courses (Coursera, Udemy, freeCodeCamp) and want ' +
        'credit for the learning. Certificates feel like credentials.',
      whyItFails:
        'Online course certifications have minimal credibility in admissions. They show ' +
        'consumption (watching videos, completing exercises) not production (building, creating, ' +
        'solving). AOs see them as participation trophies. The time spent earning 5 certifications ' +
        'would have been better spent building one real project.',
      betterAlternative:
        'Describe what you BUILT using the knowledge from those courses. ' +
        '"Completed 3 web development courses" becomes "Built 3 websites for local nonprofits."',
      example: {
        nameDrop:
          'Completed certifications in Python, Web Development, Data Science, and Machine Learning from Coursera',
        improved:
          'Self-taught web development; built 3 pro bono nonprofit websites — one helped org increase donations 25%',
        whatChanged:
          'Replaced 4 certifications (consumption) with 3 real projects (production) and ' +
          'measurable impact (25% donation increase). Self-teaching is implied by the output. ' +
          'The certifications added no value; the websites add enormous value.',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'certification', 'certificate', 'completed course', 'Coursera',
        'Udemy', 'edX', 'freeCodeCamp', 'Codecademy', 'bootcamp',
        'online course', 'certified in',
      ],
    },
    {
      id: 'ce_blockchain_web3',
      pattern: '"Blockchain" / "Web3" / "NFT" / "Crypto" buzzwords',
      whyStudentsUseIt:
        'Blockchain/crypto was extremely hyped during these students\' formative years. ' +
        'Some students genuinely explored the technology; many use the terminology for cachet.',
      whyItFails:
        'The blockchain/crypto bubble has burst for most practical applications. AOs associate ' +
        '"built a blockchain app" with hype-following rather than substance. Unless the student ' +
        'is doing genuinely novel cryptographic research, these terms are red flags for ' +
        'trend-chasing over problem-solving.',
      betterAlternative:
        'If the project has genuine value, describe the VALUE without the blockchain label. ' +
        '"Built blockchain-based voting system" becomes "Built tamper-proof voting system for ' +
        'school elections — cryptographic verification, 95% student participation."',
      example: {
        nameDrop:
          'Developed blockchain-based decentralized application for secure student records management',
        improved:
          'Built tamper-proof academic transcript system — school adopted for 1,200 students; eliminated 100% of manual verification calls',
        whatChanged:
          'Removed "blockchain" and "decentralized" (buzzwords). Described the value proposition ' +
          '(tamper-proof, eliminated manual verification) and adoption (1,200 students). ' +
          'The cryptographic security is implied; the impact is explicit.',
      },
      prevalence: 'occasional',
      typicalCharWaste: 25,
      detectionKeywords: [
        'blockchain', 'Web3', 'NFT', 'crypto', 'decentralized',
        'smart contract', 'Ethereum', 'Solidity', 'DApp', 'token',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'ce_pow_user_feedback_loop',
      pattern:
        'Student describes receiving, processing, and acting on feedback from real users — ' +
        'not hypothetical users, but people actually using the product.',
      whyItProves:
        'Having real users means the product was deployed, and acting on their feedback means ' +
        'the student engaged with the messy reality of serving people. You cannot fake a ' +
        'user feedback loop — it requires a deployed product and sustained attention.',
      examples: [
        'Teacher feedback: "search is too slow" → added caching, reduced load time from 4s to 0.3s — teachers confirmed improvement',
        'Parents requested dark mode and larger fonts → v2 update increased daily engagement 35%',
        'Food bank director identified edge case in donation tracking → fixed same day, preventing $2K inventory error',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student does not just code — they serve users. They listen, respond, and improve. ' +
        'This is the orientation of someone who will contribute meaningfully to any team.',
    },
    {
      id: 'ce_pow_debugging_war_story',
      pattern:
        'Student describes a significant debugging challenge — a production issue, a subtle ' +
        'bug, or a performance problem — and how they diagnosed and resolved it.',
      whyItProves:
        'Real debugging stories are impossible to fabricate. A student who describes "traced ' +
        'memory leak to unclosed database connection in event handler" has done real ' +
        'engineering. Tutorial-followers do not encounter production bugs because they never deploy.',
      examples: [
        'App crashed under load: traced to race condition in concurrent database writes — implemented connection pooling',
        'Users reported data loss — found caching layer discarding writes during network timeouts; added write-through cache',
        'Performance degraded 10x over 3 months — database queries scaling quadratically; restructured to indexed lookups',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has wrestled with the hard parts of software development. ' +
        'They can diagnose complex problems and think systematically about solutions.',
    },
    {
      id: 'ce_pow_version_evolution',
      pattern:
        'Student describes the evolution of their project across versions — each version ' +
        'reflecting learning, feedback, and increasing sophistication.',
      whyItProves:
        'Version progression proves sustained commitment and iterative improvement. A student ' +
        'who describes "v1 was command-line only, v2 added web interface, v3 went mobile" ' +
        'has clearly been developing for an extended period. Each version is a checkpoint ' +
        'of real learning.',
      examples: [
        'v1: Python script (just for me). v2: web app (shared with class). v3: mobile app (school-wide, 400 users)',
        'Started as hackathon prototype → added auth system → integrated with school databases → now multi-school platform',
        '3 major rewrites over 18 months: each taught me what I did wrong the previous time — final version 4x faster',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student learns by iterating. They are not afraid to improve or even rewrite ' +
        'their work. This growth mindset is exactly what colleges want in incoming students.',
    },
    {
      id: 'ce_pow_deployment_ops',
      pattern:
        'Student describes operational challenges of running a live system — uptime, ' +
        'monitoring, cost management, security patches.',
      whyItProves:
        'Deploying and operating software is a completely different skill from building it. ' +
        'A student who manages uptime, handles production incidents, and patches security ' +
        'issues has crossed into professional-level responsibility. This is extremely rare ' +
        'for high school students.',
      examples: [
        'Maintained 99.5% uptime over 8 months — set up automated monitoring and on-call rotation with 2 other student devs',
        'Migrated from $50/month hosting to serverless — cut costs 80% while handling 3x more traffic',
        'Detected and patched XSS vulnerability within 24 hours of automated security scan flagging it',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has real operational experience. They understand that software is not ' +
        '"done" when you deploy it — it is just the beginning. This maturity is rare.',
    },
    {
      id: 'ce_pow_mentoring_progression',
      pattern:
        'Student describes progressing from being mentored to mentoring others — showing ' +
        'the complete learning arc from beginner to teacher.',
      whyItProves:
        'The full arc from learner to teacher is the strongest proof of genuine mastery. ' +
        'A student who learned to code 2 years ago and now teaches workshops has compressed ' +
        'years of growth into a compelling narrative. The progression is verifiable through ' +
        'the outcomes of their teaching.',
      examples: [
        'Learned to code at 14 → built first app at 15 → teaching weekly workshops to 20 students at 16 → 5 students now building their own apps',
        'Started in beginner CS class → became TA → now running after-school coding club for 3rd year, 50+ alumni',
        'Mentee at Girls Who Code → section leader → now regional ambassador training 8 new section leaders',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student completes learning cycles and gives back. The transition from student ' +
        'to teacher demonstrates mastery, generosity, and leadership.',
    },
    {
      id: 'ce_pow_code_review',
      pattern:
        'Student references having code reviewed by others, reviewing others\' code, or ' +
        'participating in professional development practices.',
      whyItProves:
        'Code review is a professional practice that most student developers never encounter. ' +
        'A student who describes reviewing PRs, getting feedback from professional developers, ' +
        'or following a branching strategy has participated in real software engineering. ' +
        'This is proof of engagement with the professional community.',
      examples: [
        'Open-source contributions: every PR reviewed by project maintainer — learned clean code practices from professional feedback',
        'Set up code review process for school coding club — reviewed 100+ student PRs over the year',
        'Interned at startup: participated in daily code reviews, CI/CD pipeline management, sprint planning',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student engages with professional software development practices. They are not ' +
        'just coding alone in their room — they are participating in a professional community.',
    },
    {
      id: 'ce_pow_accessibility',
      pattern:
        'Student describes building for accessibility — screen reader support, keyboard ' +
        'navigation, color contrast, multilingual support.',
      whyItProves:
        'Accessibility awareness is rare among professional developers, let alone students. ' +
        'A student who builds with accessibility in mind demonstrates empathy, attention to ' +
        'detail, and awareness of diverse users. This is a proof-of-work that signals maturity ' +
        'far beyond technical skill.',
      examples: [
        'Built school website with WCAG 2.1 AA compliance — added screen reader support and keyboard navigation for visually impaired students',
        'Multilingual support: translated app into Spanish and Mandarin after discovering 40% of parent users were non-English speakers',
        'Added high-contrast mode and text-to-speech after learning a classmate with dyslexia struggled with the default interface',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student thinks about users who are different from them. They build for inclusion, ' +
        'not just function. This empathy and awareness is exactly what colleges look for.',
    },
    {
      id: 'ce_pow_community_impact_story',
      pattern:
        'Student describes a specific moment where their project made a tangible difference ' +
        'for a real person or organization.',
      whyItProves:
        'Impact stories are the ultimate proof-of-work for software projects. A student who ' +
        'can describe a specific person whose life was improved by their software has closed ' +
        'the loop from code to impact. These stories are vivid, memorable, and impossible ' +
        'to fabricate convincingly.',
      examples: [
        'Food bank director called to say system caught a 200-lb meat order about to expire — saved $1,400 in donations',
        'Student with ADHD told me the app was "the first tool that actually worked" for managing assignments',
        'Teacher showed me that my attendance tool saved her 8 hours per week — she used the time for one-on-one student check-ins',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student builds things that matter to real people. The specificity of the impact ' +
        'story proves the project is genuine and valued. This is exactly the kind of student ' +
        'who will make an impact on campus.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'ce_dt_stack_to_impact',
      transformType: 'name_drop_to_impact',
      before: 'Built web app using React, Node.js, Express, MongoDB, and deployed on Heroku',
      after: 'Built volunteer matching platform for 3 nonprofits: 200+ volunteers placed, 2,500 service hours logged',
      explanation:
        'The tech stack (React, Node, Express, MongoDB, Heroku = 45 chars) communicates nothing ' +
        'to AOs. The impact version uses those characters for users (3 nonprofits, 200+ volunteers), ' +
        'output (2,500 service hours), and purpose (volunteer matching).',
      charsBefore: 75,
      charsAfter: 99,
      principle: 'The tech stack is invisible to the reader. The impact is unforgettable.',
    },
    {
      id: 'ce_dt_generic_app_to_specific',
      transformType: 'generic_to_specific',
      before: 'Developed mobile application to help students with time management',
      after: 'Built ADHD-focused planner with customizable alerts and visual progress — 400 daily users, 4.6 App Store rating',
      explanation:
        '"App to help students with time management" could describe a to-do list or a ' +
        'sophisticated adaptive system. The improved version specifies the target audience (ADHD), ' +
        'key features (customizable alerts, visual progress), and validation (400 users, 4.6 rating).',
      charsBefore: 64,
      charsAfter: 103,
      principle: 'Specificity is credibility. The more specific, the more believable.',
    },
    {
      id: 'ce_dt_buzzword_to_capability',
      transformType: 'jargon_to_outcome',
      before: 'Created AI-powered machine learning application for personalized education',
      after: 'Built math tutor that adapts problems to each student\'s weaknesses — 89% of users improved one letter grade',
      explanation:
        '"AI-powered machine learning for personalized education" is 55 characters of buzzwords. ' +
        'The improved version describes what the AI DOES (adapts problems to weaknesses) and ' +
        'PROVES it works (89% improved a letter grade). The intelligence is demonstrated, not claimed.',
      charsBefore: 70,
      charsAfter: 99,
      principle: 'Demonstrate intelligence through results, not labels.',
    },
    {
      id: 'ce_dt_passive_to_builder',
      transformType: 'passive_to_active',
      before: 'Worked on developing software projects and learning programming skills',
      after: 'Built 4 production tools: school scheduler (800 users), food bank tracker, 2 npm packages (500+ installs each)',
      explanation:
        '"Worked on developing" and "learning skills" are passive and vague. The revised ' +
        'version lists specific products with metrics. Each project name implies the skills ' +
        'learned. Leading with "Built" immediately positions the student as a creator.',
      charsBefore: 66,
      charsAfter: 104,
      principle: 'Replace learning verbs with building verbs. Output proves input.',
    },
    {
      id: 'ce_dt_claim_to_metric',
      transformType: 'claim_to_evidence',
      before: 'Created innovative technology solution that made a significant impact on the community',
      after: 'Built water quality monitoring system for 4 local streams: alerts triggered 3 contamination reports to EPA',
      explanation:
        '"Innovative," "significant impact," and "community" are all claims. The improved version ' +
        'provides a specific system (water quality monitoring), scope (4 streams), and measurable ' +
        'impact (3 EPA contamination reports). The reader concludes it is innovative and impactful ' +
        'from the evidence.',
      charsBefore: 83,
      charsAfter: 104,
      principle: 'Never claim innovation. Describe the evidence and let the reader conclude.',
    },
    {
      id: 'ce_dt_duty_to_creation',
      transformType: 'duty_to_achievement',
      before: 'Responsible for web development and maintaining the school website content',
      after: 'Rebuilt school website: mobile-first design increased parent engagement 3x; created admin dashboard so teachers self-update',
      explanation:
        '"Responsible for maintaining" is a job description. "Rebuilt" and "created" are ' +
        'achievements. The improved version shows initiative (rebuilt, not just maintained), ' +
        'design thinking (mobile-first), measurable impact (3x engagement), and system design ' +
        '(admin dashboard for teacher self-service).',
      charsBefore: 72,
      charsAfter: 114,
      principle: 'Transform maintenance duties into creation stories.',
    },
    {
      id: 'ce_dt_language_to_product',
      transformType: 'name_drop_to_impact',
      before: 'Experienced programmer in Python, JavaScript, and Java with strong algorithm skills',
      after: 'Built 3 tools used by real organizations: Python data pipeline for hospital (10K records/day), school app (500 users), open-source library (200 stars)',
      explanation:
        'Language names and self-assessed skill levels are meaningless. The revised version ' +
        'turns each language into a specific product with a specific user and impact. The ' +
        'languages are implied; the products and users are explicit.',
      charsBefore: 77,
      charsAfter: 148,
      principle: 'Languages are inputs. Products and users are outputs. Show the outputs.',
    },
    {
      id: 'ce_dt_hackathon_to_product',
      transformType: 'generic_to_specific',
      before: 'Participated in multiple hackathons and developed tech projects',
      after: 'Won HackMIT: built real-time sign language translator — continued development, now used by 2 Deaf schools',
      explanation:
        '"Multiple hackathons" and "tech projects" are vague. The improved version focuses on ' +
        'ONE hackathon with: the result (won), what was built (sign language translator), and ' +
        'the real-world continuation (2 Deaf schools). One vivid story beats many vague ones.',
      charsBefore: 61,
      charsAfter: 103,
      principle: 'One deep story beats five shallow mentions.',
    },
    {
      id: 'ce_dt_robotics_to_specific',
      transformType: 'passive_to_active',
      before: 'Member of robotics team, working on programming and mechanical design',
      after: 'Programmed autonomous navigation for FRC robot: computer vision + path planning — robot scored 45 pts/match, team placed 3rd at regionals',
      explanation:
        '"Member" and "working on" are passive. The revised version specifies the exact ' +
        'system built (autonomous navigation), the techniques (computer vision, path planning), ' +
        'and quantified results (45 pts/match, 3rd at regionals). The student\'s individual ' +
        'contribution is now visible within the team context.',
      charsBefore: 68,
      charsAfter: 136,
      principle: 'In team projects, surgically define YOUR system and its measurable output.',
    },
    {
      id: 'ce_dt_opensource_specific',
      transformType: 'generic_to_specific',
      before: 'Active open-source contributor with many GitHub contributions',
      after: 'Contributed 15 merged PRs to React ecosystem: fixed accessibility bugs affecting 50K+ users; maintain 2 packages (800 weekly downloads)',
      explanation:
        '"Active contributor" and "many contributions" are vague. The improved version quantifies ' +
        'contributions (15 merged PRs), names the ecosystem (React), specifies impact ' +
        '(accessibility bugs, 50K+ users), and shows ownership (maintain 2 packages, 800 downloads). ' +
        'Every claim is specific and verifiable.',
      charsBefore: 58,
      charsAfter: 141,
      principle: 'Open-source credibility comes from merged contributions and maintained packages, not commit counts.',
    },
    {
      id: 'ce_dt_cert_to_building',
      transformType: 'name_drop_to_impact',
      before: 'Completed multiple programming certifications and online courses in web development',
      after: 'Self-taught web dev → built 3 pro bono nonprofit sites: one org\'s online donations increased 40% after redesign',
      explanation:
        'Certifications are consumption metrics. The improved version shows the same self-teaching ' +
        'but foregrounds production (3 nonprofit sites) and impact (40% donation increase). ' +
        'The self-teaching is evident from the output. Certifications add nothing.',
      charsBefore: 79,
      charsAfter: 105,
      principle: 'Certifications prove you learned. Projects prove you can build.',
    },
    {
      id: 'ce_dt_ai_to_capability',
      transformType: 'jargon_to_outcome',
      before: 'Built AI-powered deep learning neural network for image classification and analysis',
      after: 'Built plant disease detector for local farms: photograph leaf, get diagnosis in 3 sec — 92% accuracy, saved 2 harvests',
      explanation:
        '"AI-powered deep learning neural network for image classification" is 62 characters of ' +
        'jargon. The improved version tells you WHAT the system does (diagnoses plant disease), ' +
        'for WHOM (local farms), HOW FAST (3 seconds), HOW WELL (92%), and IMPACT (saved 2 harvests). ' +
        'Every piece of information is universally understandable.',
      charsBefore: 79,
      charsAfter: 110,
      principle: 'Translate technical capability into human benefit.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'Built', 'Deployed', 'Shipped', 'Launched', 'Automated',
        'Architected', 'Designed', 'Invented', 'Scaled', 'Founded',
      ],
      context:
        'Power verbs in coding/engineering signal creation, delivery, and real-world impact. ' +
        '"Built" and "Deployed" imply a working product that exists in the world. "Automated" ' +
        'implies a measurable efficiency gain. "Shipped" implies professional-level completion. ' +
        'These verbs position the student as a creator who delivers results.',
      exampleUsage:
        'Built scheduling platform used by 3 schools; deployed to AWS with 99.5% uptime over 8 months',
    },
    {
      tier: 'standard',
      verbs: [
        'Developed', 'Created', 'Programmed', 'Implemented', 'Integrated',
        'Contributed', 'Maintained', 'Optimized', 'Refactored', 'Tested',
      ],
      context:
        'Standard verbs describe solid technical work but do not inherently signal impact or ' +
        'completion. "Developed" is fine but needs a strong object. "Implemented" suggests ' +
        'following a specification rather than creating one. Pair these with specific metrics ' +
        'or outcomes to strengthen them.',
      exampleUsage:
        'Developed food bank inventory system; implemented predictive alerts that reduced waste 30%',
    },
    {
      tier: 'weak',
      verbs: [
        'Coded', 'Learned', 'Studied', 'Practiced', 'Explored',
        'Experimented with', 'Worked on', 'Helped build', 'Assisted with', 'Used',
      ],
      context:
        'Weak verbs in coding signal consumption rather than production. "Learned Python" and ' +
        '"studied machine learning" are about the student, not about what was built. "Coded in" ' +
        'treats the language as the achievement. "Worked on" is vague. Replace these with what ' +
        'was PRODUCED using those skills.',
      exampleUsage:
        'Avoid: "Learned React and worked on web development projects" — replace with what was built',
    },
  ],

  roleExpertise: [
    {
      role: 'Solo Developer / Indie Builder',
      expectedSignals: [
        'Clear problem identification showing WHY this project was built',
        'Evidence of real users or deployment beyond personal use',
        'Description of the product in terms of what it DOES, not how it was built',
        'Iteration and maintenance over time (not just "built and moved on")',
      ],
      differentiators: [
        'Significant user base (hundreds or thousands of users)',
        'Revenue generation or organizational adoption',
        'User feedback integration with multiple version iterations',
        'Open-source contributions accepted by established projects',
        'Product sustained over 1+ years with active maintenance',
      ],
      overclaimingRisks: [
        'Tutorial project presented as original creation',
        'Listing tech stack instead of describing the product',
        'Claiming "thousands of users" for a project with no deployment evidence',
        '"AI-powered" label on a simple CRUD app with one API call',
        'Claiming "from scratch" when using frameworks and templates',
      ],
      authenticPatterns: [
        'Problem-first narrative: "Noticed X problem, built Y solution"',
        'Specific user metrics with realistic numbers',
        'Mentions of challenges, bugs, or things they would do differently',
        'Honest about scope: does not inflate a weekend project into a startup',
      ],
    },
    {
      role: 'Team Developer / Collaborator',
      expectedSignals: [
        'Specific personal contribution within the team clearly delineated',
        'Description of the system or component they owned',
        'Reference to collaboration practices (code review, planning, etc.)',
        'The team\'s overall outcome with the student\'s role in achieving it',
      ],
      differentiators: [
        'Owned a critical system or feature that the project depended on',
        'Brought a unique skill that no other team member had',
        'Set up infrastructure or practices that improved the whole team',
        'Mentored other team members on technical topics',
      ],
      overclaimingRisks: [
        'Describing team project as if it were solo work',
        'Using "we" exclusively to hide minimal personal contribution',
        'Claiming credit for components built by teammates',
        'Inflating role: "tech lead" for a 2-person school project',
      ],
      authenticPatterns: [
        'Clear "I built X; teammate built Y" delineation',
        'Describes collaboration dynamics honestly',
        'Mentions learning from teammates alongside personal contribution',
        'Team outcome paired with individual responsibility',
      ],
    },
    {
      role: 'Open Source Contributor',
      expectedSignals: [
        'Specific projects contributed to with PR counts and acceptance rate',
        'Description of what was fixed, added, or improved',
        'Engagement with project maintainers and review feedback',
        'Understanding of the project\'s purpose and their contribution to it',
      ],
      differentiators: [
        'Contributions to well-known projects (React, Firefox, Linux, etc.)',
        'Maintainer or core contributor status on active projects',
        'Created packages/libraries adopted by other developers',
        'Impact metrics: downloads, stars, dependent projects',
        'Mentored other contributors or wrote documentation',
      ],
      overclaimingRisks: [
        'Counting typo fixes as "open source contributions"',
        'Listing GitHub activity (commits, repos) as achievements',
        'Claiming to "contribute to" a project with only 1 small PR',
        '"Created open-source project" for a repo with no users',
      ],
      authenticPatterns: [
        'References specific issues fixed or features added',
        'Mentions review feedback received and how they improved',
        'Describes the project\'s purpose and their role in it',
        'Honest about contribution scope: "fixed 12 accessibility bugs"',
      ],
    },
    {
      role: 'Hardware / Robotics Builder',
      expectedSignals: [
        'Description of what was built and its physical function',
        'Integration of hardware and software components',
        'Testing and iteration in physical environment',
        'Specific materials, sensors, or components referenced in context',
      ],
      differentiators: [
        'Original design solving a real-world problem (not just competition)',
        'Design adopted by organization or deployed in real environment',
        'Patent or provisional patent filed',
        'Physical device used by real people outside the builder\'s school',
        'Competition achievement (FRC, Science Olympiad build events)',
      ],
      overclaimingRisks: [
        'Following a tutorial/kit and claiming original design',
        'Listing components (Arduino, Raspberry Pi, servos) without describing function',
        'Claiming team robot as personal project',
        'Overstating hardware capabilities without testing evidence',
      ],
      authenticPatterns: [
        'Describes design constraints and how they were addressed',
        'References testing, failure, and iteration cycles',
        'Specific about materials, techniques, and their limitations',
        'Honest about what worked and what would be improved',
      ],
    },
    {
      role: 'Coding Educator / Community Leader',
      expectedSignals: [
        'Number of students taught with measurable outcomes',
        'Curriculum or resources created for teaching',
        'Sustained commitment to teaching over time',
        'Adaptation of teaching based on student needs',
      ],
      differentiators: [
        'Students taught went on to build their own projects or win competitions',
        'Created lasting program or organization that continues without the founder',
        'Taught underserved or underrepresented communities',
        'Created scalable resources (YouTube, curriculum, textbook) reaching beyond local community',
      ],
      overclaimingRisks: [
        'Calling one tutoring session "founded coding education program"',
        'Claiming credit for students\' pre-existing abilities',
        'Inflating participant numbers or outcomes',
        '"Taught AI" when actually taught basic Python',
      ],
      authenticPatterns: [
        'Specific student counts with honest outcome metrics',
        'Describes teaching methodology and why it works',
        'References specific challenges in teaching and how they were addressed',
        'Shows progression from small to larger impact over time',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Open-source project with verifiable community adoption metrics',
      whyItsTheException:
        'When a student\'s open-source library has 1,000+ GitHub stars or 10K+ weekly npm downloads, ' +
        'those metrics ARE the achievement. "npm package with 15K weekly downloads" is a stronger ' +
        'signal than any description of what the package does. The adoption metrics prove ' +
        'professional-quality work.',
      example:
        'Open-source data visualization library: 1,200 GitHub stars, 15K weekly npm downloads, used in 3 university courses',
    },
    {
      pattern: 'App Store / Play Store publication with ratings',
      whyItsTheException:
        'Publishing to official app stores requires meeting quality standards, handling review ' +
        'processes, and competing in an open market. A rating (e.g., "4.7 stars, 5K downloads") ' +
        'is market validation that no description can replicate. The store and rating ARE the ' +
        'proof of quality.',
      example:
        'Published iOS app: 4.7 stars, 5,000+ downloads — habit tracker for ADHD students, featured in "Students" collection',
    },
    {
      pattern: 'Contribution to well-known open-source project (Linux, Chromium, React)',
      whyItsTheException:
        'Contributing to Linux, Chromium, React, or similarly prominent projects is itself the ' +
        'credential. These projects have rigorous review processes, and having a PR merged means ' +
        'professional engineers approved your code. The project name signals the difficulty level.',
      example:
        'Contributed 8 merged patches to Chromium: fixed rendering bugs in SVG handling — used by 3B+ Chrome users',
    },
    {
      pattern: 'Specific technical achievement when it IS the point (e.g., sub-100ms latency)',
      whyItsTheException:
        'When the technical metric IS the achievement — "sub-100ms response time on $5/month ' +
        'hosting" or "99.99% uptime" — the jargon communicates the difficulty and the ' +
        'achievement simultaneously. These metrics are meaningful even to non-technical readers ' +
        'when paired with context.',
      example:
        'Built real-time multiplayer game engine: 60fps on mobile hardware, <50ms latency — 2,000 concurrent players at peak',
    },
  ],
};
