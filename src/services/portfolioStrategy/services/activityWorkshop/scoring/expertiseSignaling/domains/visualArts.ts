/**
 * Visual Arts & Design — Expertise Signaling Domain
 *
 * Field-specific expertise patterns for visual arts, design, photography,
 * and other portfolio-based creative activities.
 *
 * Key insight: Visual arts applicants face a unique challenge — their best work
 * is VISUAL, but the Common App activity description is TEXT. AOs evaluating
 * art activities look for evidence of artistic process, external validation
 * (juried shows, commissions), and creative identity development. Naming
 * mediums without context is the visual arts equivalent of tech name-dropping.
 *
 * Sources: NASAD portfolio review criteria, Scholastic Art Awards data,
 * published AO insights on arts supplements, RISD/Pratt/SAIC admissions guidance.
 */

import type { ExpertiseDomain } from '../types';

export const VISUAL_ARTS_DOMAIN: ExpertiseDomain = {
  domainId: 'visual_arts',
  label: 'Visual Arts & Design',
  overview: `Visual arts activities in college applications bridge two worlds: the applicant's visual portfolio (submitted separately or via arts supplement) and the 150-character text description on the Common App. AOs reading the activity list don't see the art — they see words about art. The description must convey artistic seriousness, process, and external validation in text.

The most common mistake is treating the activity description like a medium inventory: "painting, sculpture, digital art, photography." AOs don't care WHAT mediums you use — they care about artistic development, selectivity of exhibitions, and evidence that art is a genuine practice, not a hobby. Juried exhibitions, commissions, gallery representation, and teaching are the signals that separate serious artists from students who took AP Art.

AOs at art-focused schools (RISD, Pratt, SAIC) read portfolios directly. But at liberal arts and research universities, the activity list is often the only art-related content they see. The description must do heavy lifting: conveying artistic identity, achievement level, and commitment in very few characters.`,

  aoExpectations: {
    whatRegisters: [
      'Selection into juried exhibitions or competitive shows with clear selectivity',
      'Commissions or sales that prove external demand for the work',
      'Artistic voice or thematic focus that shows identity development',
      'Teaching or mentoring others in artistic skills',
      'Public installations, murals, or community art projects with real impact',
      'Recognition from established arts organizations (Scholastic Art, regional competitions)',
      'Sustained portfolio development showing growth over years, not just a class project',
    ],
    whatAOsSeeThrough: [
      'Medium listing without accomplishment ("painting, sculpture, photography")',
      'AP Art score or grade as the primary achievement',
      'DeviantArt/Instagram followers as validation of artistic merit',
      'Claiming "self-taught" without portfolio evidence or external recognition',
      'Art class participation framed as a serious creative practice',
      'Technology/software name-dropping ("Procreate, Photoshop, Illustrator")',
      'Pinterest boards or mood boards described as creative work',
    ],
    goldenQuestion: 'Has someone outside your school — a gallery, a juried show, a client, a community — chosen your work because of its quality?',
    readingTimeContext: 'AOs spend 7-10 seconds on each activity. For visual arts, they cannot see the work — they can only read about it. The description must convey the level of the work through external validation and process evidence, since the visual quality is invisible in text.',
    competitiveContext: 'Art activities are common but juried exhibition selection is rare. ~20% of applicants at selective schools claim some art activity, but fewer than 2% have external juried recognition. Scholastic Art Gold Key, gallery exhibitions, and commissioned work are the differentiators.',
  },

  realExpertiseSignals: [
    {
      id: 'va_juried_exhibition',
      pattern: 'selective_exhibition',
      description: 'Selection into juried exhibitions with known selectivity — the strongest external validation for visual art',
      whyItWorks: 'Juried exhibitions mean professional artists or curators evaluated and selected the work. This is the visual arts equivalent of publication in a selective journal.',
      examples: [
        'Selected for juried youth exhibition at City Art Museum (120 entries, 15 selected)',
        'Work exhibited in regional Scholastic Art show after Gold Key selection',
        'Piece chosen for state governor\'s art exhibition from 500+ submissions',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: ['juried', 'exhibition', 'gallery', 'selected', 'exhibited', 'show', 'museum', 'curator'],
    },
    {
      id: 'va_commission_work',
      pattern: 'paid_commission',
      description: 'Receiving commissions or selling work — proof that external demand exists',
      whyItWorks: 'When someone pays for your art, it proves the work has value beyond school assignments. Commissions demonstrate professional-level quality and client relationships.',
      examples: [
        'Completed 15 portrait commissions for families in community, earning $3,000+',
        'Designed logo and branding package for local nonprofit (pro bono, client-directed)',
        'Murals commissioned by 3 local businesses for storefront beautification project',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: ['commission', 'commissioned', 'client', 'sold', 'purchased', 'hired', 'freelance'],
    },
    {
      id: 'va_artistic_voice',
      pattern: 'thematic_focus',
      description: 'Evidence of developing a distinctive artistic voice or thematic body of work',
      whyItWorks: 'Artistic voice shows the student has moved beyond assignments to self-directed creative exploration. A coherent theme across works demonstrates artistic maturity.',
      examples: [
        'Developed 20-piece portfolio exploring urban decay through mixed-media assemblage',
        'Year-long series documenting immigrant storefronts through watercolor and photography',
        'Sculptural work exploring disability and accessibility using reclaimed materials',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: ['series', 'portfolio', 'body of work', 'exploring', 'theme', 'voice', 'vision', 'identity'],
    },
    {
      id: 'va_public_installation',
      pattern: 'community_art',
      description: 'Public art installations, murals, or community projects that reach beyond the studio',
      whyItWorks: 'Public art demonstrates that the student can translate personal vision into community impact. It requires collaboration, scale, and audience awareness.',
      examples: [
        'Designed and painted 40-foot mural at community center with 8-person team',
        'Created public art installation for school courtyard addressing mental health awareness',
        'Led mosaic project at children\'s hospital, coordinating 30 volunteer artists',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: ['mural', 'installation', 'public art', 'community', 'mosaic', 'monument', 'permanent'],
    },
    {
      id: 'va_awards_recognition',
      pattern: 'competitive_recognition',
      description: 'Awards from recognized visual arts organizations with known selectivity',
      whyItWorks: 'Major art awards (Scholastic Gold Key, Congressional Art Competition, YoungArts) have known selectivity and AOs recognize them as legitimate achievement markers.',
      examples: [
        'Scholastic Art Gold Key in painting (top 1% of 100K+ submissions nationally)',
        'Congressional Art Competition winner — work displayed in U.S. Capitol for one year',
        'YoungArts finalist in visual arts, invited to National YoungArts Week in Miami',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: ['Scholastic', 'Gold Key', 'Silver Key', 'Congressional Art', 'YoungArts', 'award', 'finalist', 'winner', 'honorable mention'],
    },
    {
      id: 'va_technical_range',
      pattern: 'medium_mastery',
      description: 'Demonstrated technical mastery across mediums with evidence, not just listing',
      whyItWorks: 'Cross-medium competence with evidence (exhibited works in multiple mediums, teaching both) signals genuine technical depth vs. dabbling.',
      examples: [
        'Exhibited work in oil painting, printmaking, and ceramics at 3 separate juried shows',
        'Teach watercolor and digital illustration workshops at community center',
        'Portfolio spans charcoal portraiture and digital 3D modeling, both exhibited regionally',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'specificity',
      detectionKeywords: ['mastery', 'technique', 'medium', 'oil', 'watercolor', 'ceramics', 'printmaking', 'digital'],
    },
    {
      id: 'va_teaching_mentoring',
      pattern: 'art_instruction',
      description: 'Teaching art to others — demonstrates mastery and community service through creative skill',
      whyItWorks: 'Teaching art requires both technical mastery and communication skill. It shows the student has moved beyond learning to sharing knowledge.',
      examples: [
        'Lead weekly art workshops for elementary students at community center (2 years, 40+ students)',
        'Created and taught watercolor basics curriculum for senior center, 15 regular participants',
        'Mentored 5 underclassmen through AP Art portfolio development',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: ['teach', 'taught', 'workshop', 'mentor', 'instruction', 'class', 'curriculum', 'students'],
    },
  ],

  nameDropTraps: [
    {
      id: 'va_medium_listing',
      pattern: 'medium_inventory',
      whyStudentsUseIt: 'Listing mediums feels like showing range. Students think "painting, sculpture, photography" sounds impressive.',
      whyItFails: 'Mediums are tools, not achievements. AOs want to know what you created and who recognized it, not what materials you used.',
      betterAlternative: 'Replace medium list with achievement in your strongest medium.',
      example: {
        nameDrop: 'Work in painting, sculpture, ceramics, photography, and digital art',
        improved: 'Oil painting series on urban migration exhibited at City Gallery juried show',
        whatChanged: 'Replaced medium inventory with specific work + selective exhibition',
      },
      prevalence: 'very_common',
      typicalCharWaste: 50,
      detectionKeywords: ['painting', 'sculpture', 'photography', 'digital art', 'ceramics', 'mixed media', 'work in'],
    },
    {
      id: 'va_ap_art_score',
      pattern: 'ap_art_reliance',
      whyStudentsUseIt: 'AP Art scores feel like concrete evidence. A 5 seems impressive.',
      whyItFails: 'AOs know AP Art scores don\'t differentiate. The portfolio IS the assessment — mentioning the score adds nothing the portfolio wouldn\'t show.',
      betterAlternative: 'Describe what\'s in the portfolio and any external recognition it received.',
      example: {
        nameDrop: 'AP Studio Art student with score of 5, completed sustained investigation',
        improved: 'Sustained investigation on environmental decay; 3 pieces selected for state-level exhibition',
        whatChanged: 'Replaced AP score with specific theme and external validation',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: ['AP Art', 'AP Studio', 'score of', 'sustained investigation'],
    },
    {
      id: 'va_software_dropping',
      pattern: 'software_names',
      whyStudentsUseIt: 'Software names (Procreate, Photoshop, Illustrator) feel like technical credentials.',
      whyItFails: 'Software is a tool. Mentioning Photoshop is like a writer mentioning Microsoft Word. AOs care about what you made, not what you made it with.',
      betterAlternative: 'Describe the work itself and its impact or recognition.',
      example: {
        nameDrop: 'Create digital art using Procreate, Photoshop, and Illustrator',
        improved: 'Digital illustrations for school literary magazine; designed cover for 3 consecutive issues',
        whatChanged: 'Replaced software list with specific application and sustained contribution',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: ['Procreate', 'Photoshop', 'Illustrator', 'InDesign', 'Blender', 'Maya', 'Figma'],
    },
    {
      id: 'va_follower_art',
      pattern: 'social_media_art',
      whyStudentsUseIt: 'Instagram/DeviantArt followers feel like audience validation. Large numbers seem impressive.',
      whyItFails: 'Social media followers ≠ artistic merit. AOs know these numbers can be gamed and don\'t reflect quality.',
      betterAlternative: 'If you have online presence, cite commissions or sales that resulted from it, not follower counts.',
      example: {
        nameDrop: 'Art Instagram account with 5,000 followers showcasing my portfolio',
        improved: '15 portrait commissions from social media presence; $2,500 earned for college savings',
        whatChanged: 'Replaced follower vanity metric with commission work and tangible outcome',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: ['followers', 'Instagram', 'DeviantArt', 'Behance', 'likes', 'views'],
    },
    {
      id: 'va_self_taught_claim',
      pattern: 'self_taught',
      whyStudentsUseIt: 'Self-taught sounds impressive — it implies natural talent and dedication.',
      whyItFails: 'Without external validation, "self-taught" means "no one has evaluated my work." AOs need proof, not claims of autodidacticism.',
      betterAlternative: 'Show what you achieved, not how you learned. External recognition validates the learning.',
      example: {
        nameDrop: 'Self-taught artist working in oil painting and digital illustration since age 12',
        improved: 'Oil painting selected for juried youth show at Regional Art Center; teach technique to peers',
        whatChanged: 'Replaced learning claim with external selection and teaching (which proves mastery)',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: ['self-taught', 'self taught', 'autodidact', 'since age'],
    },
    {
      id: 'va_class_as_practice',
      pattern: 'art_class_framing',
      whyStudentsUseIt: 'Students frame art class participation as a serious creative practice to fill the activity list.',
      whyItFails: 'AOs see through "took art class for 4 years" instantly. Class participation is curriculum, not extracurricular.',
      betterAlternative: 'Only list art if you have achievements beyond class requirements.',
      example: {
        nameDrop: 'Completed Art I, II, III, and AP Studio Art with honors',
        improved: 'Portfolio of 20 original works; 2 exhibited locally, 1 Scholastic Silver Key',
        whatChanged: 'Replaced course listing with portfolio scope and external recognition',
      },
      prevalence: 'very_common',
      typicalCharWaste: 45,
      detectionKeywords: ['Art I', 'Art II', 'art class', 'art course', 'honors art'],
    },
    {
      id: 'va_pinterest_creative',
      pattern: 'inspiration_boards',
      whyStudentsUseIt: 'Curating aesthetic content feels creative. Students conflate consumption with creation.',
      whyItFails: 'AOs value creation, not curation of others\' work. Mood boards and Pinterest are research, not achievement.',
      betterAlternative: 'Focus on original work created, not inspiration gathered.',
      example: {
        nameDrop: 'Curate art inspiration boards and study design trends for creative development',
        improved: 'Created brand identity for 3 student organizations; designed school event posters reaching 800+ students',
        whatChanged: 'Replaced passive curation with active design work with measurable reach',
      },
      prevalence: 'occasional',
      typicalCharWaste: 50,
      detectionKeywords: ['Pinterest', 'mood board', 'inspiration', 'curate', 'aesthetic'],
    },
    {
      id: 'va_style_naming',
      pattern: 'art_movement_dropping',
      whyStudentsUseIt: 'Naming art movements (impressionism, surrealism, abstract expressionism) sounds sophisticated.',
      whyItFails: 'Naming a style you work in is not an achievement. AOs care about what you made and who recognized it.',
      betterAlternative: 'Describe your actual work and its reception, not the style label.',
      example: {
        nameDrop: 'Create abstract expressionist paintings inspired by Pollock and de Kooning',
        improved: 'Abstract series on emotional landscapes; centerpiece selected for hospital healing arts program',
        whatChanged: 'Replaced art history references with specific work and community placement',
      },
      prevalence: 'occasional',
      typicalCharWaste: 35,
      detectionKeywords: ['impressionist', 'surrealist', 'abstract expressionist', 'inspired by', 'in the style of'],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'va_selection_process',
      pattern: 'juried_selection',
      whyItProves: 'Describing the selection process (submissions, acceptance rate) proves the exhibition was competitive, not open-entry.',
      examples: [
        'Selected from 120 entries for 15-person exhibition at City Arts Gallery',
        'Congressional Art Competition: chosen from 300+ entries in district',
        'Scholastic Art Gold Key (top 1% of entries in category)',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation: 'The selectivity is the proof. This student competed and was chosen.',
    },
    {
      id: 'va_commissioned_work',
      pattern: 'external_demand',
      whyItProves: 'Being asked to create work by external clients proves the artist\'s skill is recognized beyond school.',
      examples: [
        '15 paid portrait commissions from community members',
        'Hired by local business to design storefront mural',
        'Designed logo and branding for 3 student-run organizations',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation: 'External demand validates quality. Someone chose and paid for this student\'s work.',
    },
    {
      id: 'va_teaching_evidence',
      pattern: 'art_instruction',
      whyItProves: 'Teaching art to others requires mastery. The ability to break down technique and guide others proves deep understanding.',
      examples: [
        'Taught weekly watercolor workshops to 15 seniors at community center for 2 years',
        'Created drawing curriculum for after-school program serving 25 elementary students',
        'Mentored 5 peers through AP Art portfolio development; all scored 4 or 5',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation: 'Teaching proves mastery. This student can transfer knowledge, not just perform.',
    },
    {
      id: 'va_sustained_body',
      pattern: 'portfolio_development',
      whyItProves: 'A sustained body of work (20+ pieces, thematic coherence, multi-year development) proves artistic commitment beyond assignments.',
      examples: [
        '30-piece portfolio developed over 3 years exploring identity and place',
        'Year-long documentary photography project capturing community change',
        'Created 50+ pieces exploring environmental themes across painting, printmaking, and sculpture',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation: 'Sustained creative practice shows this is identity, not hobby. The student has an artistic vision.',
    },
    {
      id: 'va_public_display',
      pattern: 'community_installation',
      whyItProves: 'Public art requires negotiation, scale, and community engagement — skills beyond studio practice.',
      examples: [
        '40-foot mural at community center, developed with neighborhood input over 3 months',
        'Permanent mosaic installation at children\'s hospital, coordinating 30 volunteer artists',
        'Designed and installed interactive art display for school lobby visited by 500+ daily',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation: 'Public art shows civic engagement through creative skill. It requires collaboration and vision at scale.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'va_transform_medium_to_achievement',
      transformType: 'generic_to_specific',
      before: 'Work in painting, drawing, sculpture, and digital art',
      after: 'Oil painting series on urban displacement; 3 pieces exhibited in juried regional show',
      explanation: 'Replaces medium inventory with specific body of work and competitive exhibition.',
      charsBefore: 51,
      charsAfter: 75,
      principle: 'Mediums are tools. Achievements are what you built with them.',
    },
    {
      id: 'va_transform_class_to_portfolio',
      transformType: 'generic_to_specific',
      before: 'Completed AP Studio Art with score of 5 and 24-piece portfolio',
      after: 'AP portfolio on environmental erosion; 2 pieces in Scholastic exhibition, 1 Gold Key',
      explanation: 'Replaces class completion with specific theme and external recognition.',
      charsBefore: 56,
      charsAfter: 72,
      principle: 'The class is the vehicle. The recognition is the destination.',
    },
    {
      id: 'va_transform_software_to_output',
      transformType: 'name_drop_to_impact',
      before: 'Create digital illustrations using Procreate and Adobe Creative Suite',
      after: 'Designed covers for school literary magazine 3 years; visual identity for 2 student orgs',
      explanation: 'Replaces software name-drops with applied design work showing sustained contribution.',
      charsBefore: 61,
      charsAfter: 78,
      principle: 'No one cares what software you used. They care what you made with it.',
    },
    {
      id: 'va_transform_followers_to_commissions',
      transformType: 'name_drop_to_impact',
      before: 'Art Instagram with 3,000 followers featuring my painting and drawing work',
      after: '12 portrait commissions from social media clients; $2K earned, donated half to art nonproft',
      explanation: 'Replaces follower vanity metric with commissions and social impact.',
      charsBefore: 64,
      charsAfter: 80,
      principle: 'Commissions prove demand. Followers prove nothing.',
    },
    {
      id: 'va_transform_selftaught_to_validated',
      transformType: 'claim_to_evidence',
      before: 'Self-taught artist working in oil painting and mixed media since middle school',
      after: 'Oil painting selected for juried show at City Gallery; teach watercolor at community center',
      explanation: 'Replaces learning claim with external selection and teaching (both prove mastery).',
      charsBefore: 65,
      charsAfter: 80,
      principle: 'Don\'t tell them how you learned. Show them what you achieved.',
    },
    {
      id: 'va_transform_style_to_work',
      transformType: 'jargon_to_outcome',
      before: 'Create abstract expressionist paintings inspired by modern art movements',
      after: 'Abstract series on emotional landscapes selected for hospital healing arts program',
      explanation: 'Replaces art movement name-dropping with specific work and community placement.',
      charsBefore: 62,
      charsAfter: 72,
      principle: 'Your influences don\'t matter. Your impact does.',
    },
    {
      id: 'va_transform_passive_to_active',
      transformType: 'passive_to_active',
      before: 'Member of school art club participating in group projects and exhibitions',
      after: 'Led 8-person team creating 40-foot mural for community center; designed school art show',
      explanation: 'Transforms passive club membership into active leadership with specific projects.',
      charsBefore: 67,
      charsAfter: 78,
      principle: 'Membership is not achievement. What you created within the club is.',
    },
    {
      id: 'va_transform_duty_to_achievement',
      transformType: 'duty_to_achievement',
      before: 'Responsible for creating art for school events, posters, and social media graphics',
      after: 'Designed visual identity for 5 school events reaching 1,200+ attendees; trained 3 underclassmen',
      explanation: 'Transforms routine duty into quantified design impact and mentorship.',
      charsBefore: 73,
      charsAfter: 83,
      principle: 'Duty is what they asked you to do. Achievement is what you made happen.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'exhibited', 'selected', 'commissioned', 'installed', 'curated',
        'designed', 'created', 'sculpted', 'composed', 'illustrated',
        'mentored', 'taught', 'launched', 'transformed', 'pioneered',
      ],
      context: 'Power verbs in visual arts signal creative agency, external validation, and active contribution. They show the artist as a creator with recognized impact.',
      exampleUsage: 'Exhibited 5 pieces in juried regional show; commissioned for 3 community murals.',
    },
    {
      tier: 'standard',
      verbs: [
        'painted', 'drew', 'photographed', 'developed', 'produced',
        'completed', 'built', 'crafted', 'contributed', 'managed',
        'organized', 'coordinated', 'submitted', 'presented', 'displayed',
      ],
      context: 'Standard art verbs describe competent work but don\'t signal external validation or leadership.',
      exampleUsage: 'Painted landscapes and portraits; completed 24-piece AP portfolio.',
    },
    {
      tier: 'weak',
      verbs: [
        'explored', 'experimented', 'tried', 'practiced', 'learned',
        'studied', 'participated', 'attended', 'joined', 'helped',
        'assisted', 'worked on', 'was interested in', 'enjoyed',
      ],
      context: 'Weak verbs signal learning and exploration, not accomplishment. Appropriate for a student, but not for demonstrating achievement in an activity description.',
      exampleUsage: 'Explored various mediums and experimented with different techniques.',
    },
  ],

  roleExpertise: [
    {
      role: 'Studio Artist',
      expectedSignals: [
        'Sustained body of work (portfolio)',
        'Thematic or technical focus',
        'Some exhibition or display of work',
      ],
      differentiators: [
        'Juried exhibition selection',
        'Commissions or sales',
        'Major art awards (Scholastic Gold Key, Congressional Art)',
        'Gallery representation or recurring shows',
      ],
      overclaimingRisks: [
        'Claiming "professional artist" without professional venues',
        'Listing mediums as achievements',
        'Overstating portfolio significance',
      ],
      authenticPatterns: [
        'References specific works and their reception',
        'Mentions artistic themes or thematic development',
        'Cites external validation (shows, awards, commissions)',
      ],
    },
    {
      role: 'Muralist / Public Artist',
      expectedSignals: [
        'Completed public installations',
        'Community collaboration',
        'Scale and logistics management',
      ],
      differentiators: [
        'Multiple commissioned murals',
        'Community engagement in design process',
        'Permanent installations in public spaces',
      ],
      overclaimingRisks: [
        'Claiming solo credit for collaborative murals',
        'Overstating community engagement',
      ],
      authenticPatterns: [
        'References specific locations and scale',
        'Mentions collaboration and community input',
        'Cites ongoing presence of the work',
      ],
    },
    {
      role: 'Digital Designer',
      expectedSignals: [
        'Applied design work (not just personal projects)',
        'Client or organizational design deliverables',
        'Technical proficiency shown through output',
      ],
      differentiators: [
        'Design work for real organizations or businesses',
        'Brand identity systems (logo, visual language)',
        'Design awards or competition recognition',
      ],
      overclaimingRisks: [
        'Listing software as skill rather than showing output',
        'Claiming "designer" for personal social media graphics',
      ],
      authenticPatterns: [
        'References specific clients or organizations served',
        'Mentions design deliverables and their use',
        'Cites measurable impact (reach, recognition)',
      ],
    },
    {
      role: 'Photographer',
      expectedSignals: [
        'Sustained photography practice beyond snapshots',
        'Thematic series or documentary work',
        'Exhibition or publication of photographs',
      ],
      differentiators: [
        'Photojournalism published in real publications',
        'Juried photography exhibitions',
        'Paid photography work (events, portraits)',
        'Documentary projects with community impact',
      ],
      overclaimingRisks: [
        'Instagram photography described as professional work',
        'Equipment/camera name-dropping',
        'Claiming "photographer" without exhibitions or publications',
      ],
      authenticPatterns: [
        'References specific projects or series',
        'Mentions exhibition venues or publication credits',
        'Cites thematic focus or documentary purpose',
      ],
    },
    {
      role: 'Art Club Leader',
      expectedSignals: [
        'Organized art events or exhibitions',
        'Grew club membership or engagement',
        'Coordinated group projects',
      ],
      differentiators: [
        'Launched new programs (workshops, mentoring)',
        'External art show participation as group',
        'Community art service projects',
      ],
      overclaimingRisks: [
        'Treating club leadership as personal artistic achievement',
        'Claiming credit for members\' individual work',
      ],
      authenticPatterns: [
        'References specific programs created or events organized',
        'Mentions membership growth or engagement metrics',
        'Cites community impact of club activities',
      ],
    },
    {
      role: 'Art Instructor / Workshop Leader',
      expectedSignals: [
        'Regular teaching schedule',
        'Curriculum development',
        'Student outcomes or growth',
      ],
      differentiators: [
        'Creating original curriculum from scratch',
        'Teaching at community organizations',
        'Mentoring students to their own achievements',
      ],
      overclaimingRisks: [
        'Claiming "instructor" for informal peer helping',
        'Overstating teaching impact',
      ],
      authenticPatterns: [
        'References specific student populations and counts',
        'Mentions curriculum design or teaching methodology',
        'Cites student achievements resulting from instruction',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Scholastic Gold Key / Silver Key',
      whyItsTheException: 'Scholastic Art & Writing Awards are the most recognized student art competition in the US. The specific award level (Gold Key = top 1% of 100K+ entries) communicates achievement that AOs understand.',
      example: 'Scholastic Gold Key in painting — this single phrase conveys nationally recognized achievement.',
    },
    {
      pattern: 'Congressional Art Competition',
      whyItsTheException: 'The Congressional Art Competition is the only national art competition with work displayed in the U.S. Capitol. The name itself communicates the prestige level.',
      example: 'Congressional Art Competition winner — work displayed in U.S. Capitol.',
    },
    {
      pattern: 'YoungArts',
      whyItsTheException: 'YoungArts is a nationally recognized arts competition that leads to the Presidential Scholar in the Arts designation. AOs at selective schools know this name.',
      example: 'YoungArts finalist in visual arts — signals elite-level recognition.',
    },
    {
      pattern: 'Juried exhibition',
      whyItsTheException: '"Juried" is not jargon — it\'s a critical qualifier that distinguishes competitive shows from open-entry displays. Always include "juried" when applicable because it communicates selectivity.',
      example: 'Juried exhibition at City Gallery — "juried" is the word that proves this wasn\'t an open call.',
    },
    {
      pattern: 'AP Studio Art sustained investigation',
      whyItsTheException: 'The "sustained investigation" is the AP Art portfolio\'s core requirement — a thematic body of work. When paired with external recognition, mentioning it shows the work has both academic rigor and external validation.',
      example: 'AP sustained investigation on environmental decay; 3 pieces exhibited at state level.',
    },
  ],
};
