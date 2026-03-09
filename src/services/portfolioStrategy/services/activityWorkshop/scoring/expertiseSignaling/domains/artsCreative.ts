/**
 * Visual Arts & Creative Writing Expertise Domain
 *
 * Covers drawing, painting, sculpture, photography, digital art,
 * graphic design, creative writing (fiction, poetry, nonfiction),
 * literary magazine, filmmaking, and animation.
 *
 * Key insight: The arts have fewer standardized competitive ladders
 * than debate or athletics. The Scholastic Art & Writing Awards are
 * the universal benchmark — AOs at every selective school recognize
 * Gold Key and American Visions/Voices. Beyond Scholastic, gallery
 * representation, publication in recognized venues, juried shows,
 * and commissioned work provide external validation. The challenge
 * is distinguishing "I like to draw" from "my work was selected by
 * professional curators."
 *
 * Sources: AO insights from RISD, Yale Art, Columbia Writing Program
 * admissions, Scholastic Art & Writing Awards statistics, NACAC 2024
 * survey data, Sara Harberson on arts portfolio assessment, published
 * gallery/literary journal acceptance rates.
 */

import type { ExpertiseDomain } from '../types';

export const ARTS_CREATIVE_DOMAIN: ExpertiseDomain = {
  domainId: 'arts_creative',
  label: 'Visual Arts & Creative Writing',
  overview:
    'Visual arts and creative writing have fewer standardized competitive ladders than athletics ' +
    'or debate, making external validation more critical. The Scholastic Art & Writing Awards ' +
    '(~300,000 annual submissions) are the universal benchmark. Beyond Scholastic, the key signals ' +
    'are professional-world validation: gallery representation, publication in recognized journals, ' +
    'juried exhibitions, and commissioned work. The gap between "I like to draw" and "my work was ' +
    'selected by professional curators" is enormous — and AOs can tell immediately.',

  aoExpectations: {
    whatRegisters: [
      'External validation from professional arts community — juried shows, recognized publications, awards judged by working artists',
      'Scholastic Art & Writing Awards at any level (regional Gold Key is impressive; national medals are exceptional)',
      'Sustained body of work — a portfolio of 15+ pieces, completed manuscript, or short film demonstrates commitment beyond hobby',
      'Evidence of artistic growth and risk-taking — evolving style, experimenting with media, tackling challenging subjects',
      'Creative leadership — literary magazine editor, art show curator, workshop organizer — showing the student shapes their creative community',
      'Commercial or institutional validation — commissioned work, gallery sales, institutional acquisition, publication in curated venues',
    ],
    whatAOsSeeThrough: [
      '"Art club member" or "maintains personal portfolio" without external exhibition or recognition — this is a hobby, not an achievement',
      'Self-published work (Wattpad, DeviantArt, Medium) presented as publication credentials — no editorial selection occurred',
      'Social media follower counts as validation — followers are not curators, likes are not juried selections',
      'Listing software tools (Adobe Photoshop, Procreate, Final Cut Pro) as if they were skills — tools are invisible to AOs',
      'Vague "creative and artistic individual" claims without a body of work or external recognition to prove it',
    ],
    goldenQuestion:
      'Has anyone outside this student\'s school or family independently validated the quality of their creative work?',
    readingTimeContext:
      'AOs spend 8-12 seconds per activity. Arts descriptions that list media, software, or ' +
      'general artistic interests waste half that time. Lead with your strongest external ' +
      'validation (award, exhibition, publication) and let your portfolio supplement do the visual storytelling.',
    competitiveContext:
      'At selective institutions with strong arts programs (Yale, RISD, Columbia, NYU), AOs ' +
      'see hundreds of "artist/writer" applications. The Scholastic regional Gold Key is the ' +
      'dividing line between competitive and not. Below Gold Key, arts activities are supporting ' +
      'narrative. Above it, they become spike activities. Gallery representation or national ' +
      'publication is genuinely rare and immediately differentiating.',
  },

  realExpertiseSignals: [
    {
      id: 'ac_juried_recognition',
      pattern: 'competition_recognition_with_level',
      description:
        'Student names specific competition or award with level of recognition — not just ' +
        '"won an art award" but the specific competition, level (regional/national), and category.',
      whyItWorks:
        'Named competitions with specific levels are verifiable and allow AOs to calibrate ' +
        'achievement. "Scholastic Gold Key, painting, Northeast region" is infinitely more ' +
        'informative than "won art competition." The specificity proves the student actually ' +
        'competed and remembers the real details.',
      examples: [
        'Scholastic Art Gold Key in painting, Northeast region 2025 — work exhibited at regional ceremony',
        'Won first place in National YoungArts Week competition in creative nonfiction',
        'Silver Medal at Congressional Art Competition — work displayed in U.S. Capitol for one year',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'gold key', 'silver key', 'scholastic', 'gold medal', 'silver medal',
        'american visions', 'american voices', 'youngarts', 'congressional art',
        'juried', 'first place', 'award', 'competition', 'finalist', 'winner',
      ],
    },
    {
      id: 'ac_professional_venue',
      pattern: 'professional_exhibition_publication',
      description:
        'Student\'s work was exhibited in a professional gallery, juried show, or published ' +
        'in a recognized literary journal — venues with editorial/curatorial selection.',
      whyItWorks:
        'Professional venues select work on quality. A juried show or recognized literary ' +
        'journal means working artists, curators, or editors evaluated this student\'s work ' +
        'against other submissions (often including adult artists) and chose to include it. ' +
        'This is the strongest signal that the work has professional-level merit.',
      examples: [
        'Work selected for juried exhibition at City Arts Gallery — 40 pieces chosen from 600 submissions',
        'Short story published in The Adroit Journal (acceptance rate ~3%)',
        'Photography exhibited at regional museum as part of emerging artists showcase',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'gallery', 'exhibited', 'exhibition', 'juried show', 'published in',
        'journal', 'magazine', 'anthology', 'museum', 'selected for',
        'accepted', 'featured in', 'curated',
      ],
    },
    {
      id: 'ac_body_of_work',
      pattern: 'substantial_portfolio_evidence',
      description:
        'Student describes a substantial body of work with specific quantity, range of ' +
        'media or subjects, and evidence of artistic evolution over time.',
      whyItWorks:
        'A portfolio is the primary evidence of artistic commitment. "Completed 25-piece ' +
        'portfolio spanning charcoal, oil, and mixed media over 3 years" tells AOs that this ' +
        'student has invested sustained effort in developing their craft. The evolution across ' +
        'media shows growth, and the quantity shows discipline.',
      examples: [
        'Built 30-piece portfolio exploring portraiture in charcoal, oil, and digital media over 3 years',
        'Completed 85,000-word novel through 4 full revision cycles over 18 months',
        'Created 12-episode podcast series with original scores — 15,000 total downloads across season',
      ],
      signalStrength: 'strong',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'portfolio', 'body of work', 'collection', 'series', 'manuscript',
        'pieces', 'works', 'revision', 'drafts', 'completed', 'spanning',
        'across', 'over', 'media',
      ],
    },
    {
      id: 'ac_artistic_process',
      pattern: 'process_articulation',
      description:
        'Student describes their creative process with specificity — how they develop ideas, ' +
        'handle revision, make artistic choices, or approach technical challenges.',
      whyItWorks:
        'Describing artistic process proves genuine practice. A student who can articulate ' +
        '"I shoot 200 photos to get 5 final images — the editing process takes longer than ' +
        'the photography" demonstrates a working artist\'s relationship with their craft. ' +
        'This level of process awareness is impossible to fake.',
      examples: [
        'Each oil painting goes through 3-4 underpainting layers; learned to let compositions emerge rather than force them',
        'Revised novel opening 11 times before finding the voice — cut 6,000 words to start in the right moment',
        'Developed personal darkroom process for silver gelatin prints; batch of 40 negatives yields 3-4 exhibition-quality prints',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'process', 'revision', 'draft', 'version', 'iteration', 'technique',
        'approach', 'method', 'developed', 'experimented', 'explored',
        'evolved', 'refined', 'reworked',
      ],
    },
    {
      id: 'ac_creative_leadership',
      pattern: 'curatorial_editorial_leadership',
      description:
        'Student served in a curatorial or editorial leadership role — literary magazine editor, ' +
        'gallery show curator, workshop organizer — that required evaluating others\' work.',
      whyItWorks:
        'Curatorial and editorial leadership signals that the student\'s judgment is trusted ' +
        'by others. An editor who reads 200 submissions and selects 15 for publication has ' +
        'developed critical assessment skills. A student who curates shows is thinking about ' +
        'art beyond their own work. AOs value this community-building dimension.',
      examples: [
        'Editor-in-chief of literary magazine; read 400+ submissions per issue, selected 20 for publication',
        'Curated student art show featuring 35 artists — designed theme, hung work, wrote artist statements',
        'Founded creative writing workshop meeting weekly; mentored 12 writers through revision process',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'editor', 'curated', 'organized', 'juried', 'selected', 'founded',
        'workshop', 'mentor', 'literary magazine', 'art show', 'review',
        'submissions', 'editorial',
      ],
    },
    {
      id: 'ac_commissioned_commercial',
      pattern: 'commercial_validation',
      description:
        'Student received commissions, sold work, or earned income from creative practice — ' +
        'someone valued the work enough to pay for it.',
      whyItWorks:
        'Commercial validation means external parties decided the work has monetary value. ' +
        'A commission from a business, a sale at a gallery, or freelance illustration work ' +
        'demonstrates that the student\'s skills have market applicability. This is a different ' +
        'axis of validation from competition awards but equally meaningful.',
      examples: [
        'Commissioned by 3 local businesses for storefront murals — earned $2,400 in commissioned work over summer',
        'Sold 8 original prints at community art fair; 2 pieces purchased by local restaurant for permanent display',
        'Freelance logo design for 5 small businesses — built portfolio of professional client work',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'commissioned', 'commission', 'sold', 'purchased', 'client',
        'freelance', 'hired', 'paid', 'commercial', 'business',
        'earned', 'revenue', 'mural', 'contracted',
      ],
    },
    {
      id: 'ac_portfolio_program',
      pattern: 'institutional_portfolio_acceptance',
      description:
        'Student\'s portfolio was accepted to a competitive pre-college program, art school ' +
        'review, or institutional assessment where trained evaluators judged work quality.',
      whyItWorks:
        'Portfolio acceptance at institutions like RISD Pre-College, SAIC Early College, or ' +
        'Pratt means faculty-level evaluators assessed the work against pre-professional standards. ' +
        'These programs accept 20-30% of applicants and require 15-20 piece portfolios showing ' +
        'range and depth. Acceptance confirms professional potential.',
      examples: [
        'Portfolio accepted to RISD Pre-College program (28% acceptance rate) — selected from 2,800 applicants',
        'Accepted to Interlochen Arts Academy summer intensive based on portfolio of 20 mixed-media pieces',
        'Portfolio reviewed and accepted by SAIC for Early College program; faculty commented on color theory mastery',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'risd', 'saic', 'calarts', 'pratt', 'sva', 'parsons', 'interlochen',
        'pre-college', 'portfolio accepted', 'portfolio review', 'accepted to',
        'art school', 'summer intensive', 'early college',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'ac_software_tools',
      pattern: 'Adobe Photoshop / Illustrator / Procreate / software list',
      whyStudentsUseIt:
        'Students believe listing creative software demonstrates professional-level digital ' +
        'skills. Digital art students especially feel that naming their tools validates their ' +
        'medium as "real art." Parents may equate software knowledge with job skills.',
      whyItFails:
        'AOs are not hiring graphic designers. "Used Photoshop" is like saying "used a paintbrush" — ' +
        'the tool is invisible to the reader. What matters is what was CREATED, not what software ' +
        'was open. Listing "Adobe Creative Suite" wastes 20+ characters on information that ' +
        'communicates nothing about artistic ability or achievement.',
      betterAlternative:
        'Delete all software names. Describe the artwork itself — its subject, scale, medium, ' +
        'or reception. Let the portfolio supplement show the technical execution.',
      example: {
        nameDrop:
          'Created digital illustrations using Adobe Photoshop, Illustrator, and Procreate for school publications',
        improved:
          'Illustrated 24 editorial pieces for school newspaper; 3 selected for regional Scholastic Art Awards submission',
        whatChanged:
          'Removed 3 software names (30+ characters wasted). Added specific quantity (24 pieces), ' +
          'context (newspaper), and external validation (Scholastic submission). AO now sees ' +
          'productive creative output, not a software resume.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'photoshop', 'illustrator', 'procreate', 'adobe', 'creative suite',
        'indesign', 'after effects', 'premiere', 'lightroom', 'figma',
        'canva', 'final cut', 'davinci resolve',
      ],
    },
    {
      id: 'ac_medium_list',
      pattern: 'Long list of media/techniques',
      whyStudentsUseIt:
        'Students want to show versatility by listing every medium they have tried. It feels ' +
        'like proof of breadth. Art teachers may encourage students to mention range.',
      whyItFails:
        'Listing "oil, acrylic, watercolor, charcoal, digital, mixed media" wastes 50+ characters ' +
        'on a materials inventory. AOs do not care about what supplies you own — they care about ' +
        'what you MADE with them and how the world responded. Breadth without depth signals ' +
        'dabbling, not mastery.',
      betterAlternative:
        'Name one or two primary media if relevant, then immediately describe the best work ' +
        'or strongest recognition. Let the portfolio show range.',
      example: {
        nameDrop:
          'Work in oil, acrylic, watercolor, charcoal, ink, pastel, digital art, and mixed media across various subjects',
        improved:
          'Oil portrait series of immigrant elders in community — exhibited at city cultural center; 4 pieces acquired for permanent collection',
        whatChanged:
          'Replaced 8-medium inventory with one specific series (portraits), its subject (immigrant ' +
          'elders), venue (cultural center), and outcome (4 acquired). The reader sees an artist ' +
          'with a vision, not a supply list.',
      },
      prevalence: 'common',
      typicalCharWaste: 50,
      detectionKeywords: [
        'oil, acrylic', 'watercolor, charcoal', 'various media', 'multiple media',
        'work in', 'dabble in', 'across mediums', 'mixed media', 'ink, pastel',
        'various subjects', 'different styles',
      ],
    },
    {
      id: 'ac_social_media_metrics',
      pattern: 'Instagram / social media follower counts',
      whyStudentsUseIt:
        'Students equate social media engagement with artistic validation. High follower counts ' +
        'feel like proof of quality. Digital-native students naturally measure impact through ' +
        'social metrics.',
      whyItFails:
        'Social media followers are not curators, editors, or jurors. A popular Instagram account ' +
        'does not signal artistic achievement any more than TikTok views signal acting talent. ' +
        'AOs specifically do not count social media metrics as external validation. Listing ' +
        'follower counts can actually undermine credibility.',
      betterAlternative:
        'Replace social metrics with professional-world validation: exhibitions, publications, ' +
        'awards, commissions, or portfolio acceptance at recognized institutions.',
      example: {
        nameDrop:
          'Built art Instagram account with 5,000 followers showcasing daily drawings and digital illustrations',
        improved:
          'Daily drawing practice for 2 years (700+ pieces); juried selection for emerging artists show at county museum',
        whatChanged:
          'Replaced vanity metric (followers) with evidence of discipline (700+ pieces, 2 years) ' +
          'and professional validation (juried museum show). The commitment speaks; the likes don\'t.',
      },
      prevalence: 'common',
      typicalCharWaste: 20,
      detectionKeywords: [
        'instagram', 'followers', 'likes', 'social media', 'tiktok',
        'youtube', 'deviantart', 'behance', 'views', 'subscribers',
        'account', 'online following',
      ],
    },
    {
      id: 'ac_self_published',
      pattern: '"Published" on self-publishing platforms',
      whyStudentsUseIt:
        'Students conflate self-publishing with traditional publication. Posting on Wattpad, ' +
        'Medium, or self-publishing on Amazon feels like a publishing credit. Parents see a ' +
        '"published book" and are genuinely impressed.',
      whyItFails:
        'Self-publishing involves no editorial selection — anyone can post on Wattpad or print ' +
        'a book on Amazon KDP. AOs know the difference between editorial acceptance (The Adroit ' +
        'Journal, Kenyon Review) and self-upload. Claiming "published author" for self-published ' +
        'work can backfire if the AO investigates and finds no editorial vetting occurred.',
      betterAlternative:
        'If the writing is genuinely good, submit to recognized literary journals and competitions. ' +
        'If self-published, describe the WORK itself (word count, revision process, reader response) ' +
        'rather than claiming publication credentials.',
      example: {
        nameDrop:
          'Published author — self-published novel on Amazon and poetry collection on Wattpad with 2,000 reads',
        improved:
          'Completed 72,000-word novel through 5 revision cycles; submitted to 3 literary agents and Scholastic Writing Awards',
        whatChanged:
          'Removed misleading "published author" claim. Added the real achievement: completing and ' +
          'revising a full novel (discipline), and pursuing legitimate channels (agents, Scholastic). ' +
          'The effort is impressive even without publication.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'self-published', 'wattpad', 'medium', 'amazon kdp', 'kindle',
        'self-publish', 'blog', 'posted online', 'uploaded',
        'reads', 'views', 'personal website',
      ],
    },
    {
      id: 'ac_art_class_training',
      pattern: '"Trained in" / "Studied under" / art class credentials',
      whyStudentsUseIt:
        'Students believe naming prestigious teachers or training programs signals quality by ' +
        'association. It feels like establishing credentials. Some counselors advise mentioning ' +
        'training background.',
      whyItFails:
        'Training is input, not output. "Studied under renowned watercolorist" tells AOs about ' +
        'the teacher, not the student. AOs want to see what the student PRODUCED after training, ' +
        'not who trained them. Characters spent on teacher credentials are characters not spent ' +
        'on the student\'s own work and recognition.',
      betterAlternative:
        'Replace training credentials with the work the training enabled. ' +
        '"Studied under X" becomes "3-year mentorship produced 20-piece series exhibited at Y."',
      example: {
        nameDrop:
          'Studied painting for 4 years at prestigious local art studio under acclaimed watercolorist',
        improved:
          'Produced 20-piece watercolor series on endangered local ecosystems; exhibited at nature center, 3 pieces sold',
        whatChanged:
          'Replaced teacher credential with the student\'s work (20 pieces, specific subject), ' +
          'exhibition venue, and commercial validation (3 sold). The reader now sees the artist\'s ' +
          'output, not their tuition receipt.',
      },
      prevalence: 'common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'studied under', 'trained by', 'trained in', 'mentored by',
        'art school', 'art studio', 'prestigious', 'renowned',
        'took classes', 'years of training', 'lessons',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'ac_pow_revision_process',
      pattern:
        'Student describes the revision or iterative process — multiple drafts, reworked ' +
        'compositions, discarded pieces, evolution of a project through stages.',
      whyItProves:
        'The revision process is the hallmark of serious creative work. A student who writes ' +
        '"revised novel opening 11 times" or "repainted the central figure 4 times before the ' +
        'gesture felt right" demonstrates the working artist\'s relationship with imperfection. ' +
        'Students who pad their arts descriptions never mention revision because they do not ' +
        'understand that it IS the creative process.',
      examples: [
        'Rewrote Act 2 of screenplay 6 times — each version taught me something about pacing that theory couldn\'t',
        'Scraped 3 paintings before finding the color palette that captured the emotional tone I was after',
        'Editor rejected first 3 submissions; her feedback on characterization transformed my approach to dialogue',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student understands that art is not inspiration — it is craft. They have the ' +
        'discipline to revise and the self-awareness to know when something is not working.',
    },
    {
      id: 'ac_pow_rejection_persistence',
      pattern:
        'Student describes submitting to competitions, journals, or galleries and receiving ' +
        'rejections before eventual acceptance — showing persistence and professional mindset.',
      whyItProves:
        'Rejection is the norm in the creative world. A student who can discuss specific rejections ' +
        '("submitted to 8 journals before The Adroit accepted my story") has engaged with the ' +
        'professional creative ecosystem. Casual artists do not submit work for external judgment.',
      examples: [
        'Submitted to 12 literary journals over 2 years; first acceptance came on attempt 9 — learned to separate work from ego',
        'Applied to 4 pre-college art programs; accepted to RISD after SAIC and Pratt waitlisted me',
        'Entered Scholastic 3 years running: Honorable Mention, Silver Key, then Gold Key — each year I understood the judges\' standards better',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has a professional relationship with their creative work. They submit, ' +
        'receive feedback, improve, and try again. This resilience is exactly what arts programs ' +
        'and writing programs seek.',
    },
    {
      id: 'ac_pow_artistic_influences',
      pattern:
        'Student references specific artistic influences, movements, or works that shaped ' +
        'their creative development — showing genuine engagement with art history or literary tradition.',
      whyItProves:
        'Naming specific influences ("my portraiture was shaped by studying Kehinde Wiley\'s approach ' +
        'to background pattern") demonstrates that the student engages with their creative tradition ' +
        'as a scholar, not just a maker. This intellectual dimension is something AOs at arts-strong ' +
        'schools particularly value.',
      examples: [
        'Series inspired by Dorothea Lange — explored how documentary photography can honor dignity in poverty',
        'Poetry sequence modeled on Claudia Rankine\'s Citizen — used fragmented form to examine racial microaggressions at school',
        'Animation style emerged from studying both Miyazaki and Cartoon Saloon — blending Eastern and Celtic visual traditions',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student situates their work within a creative tradition. They are not working ' +
        'in isolation — they are in dialogue with the field. This intellectual curiosity is ' +
        'what distinguishes an artist from a hobbyist.',
    },
    {
      id: 'ac_pow_technical_growth',
      pattern:
        'Student describes mastering a specific technical challenge — perspective, color theory, ' +
        'dialogue writing, darkroom technique, animation timing — with specific milestones.',
      whyItProves:
        'Technical mastery narratives require actual experience to construct. A student who writes ' +
        '"spent 6 months learning to render hands correctly — filled 3 sketchbooks with nothing but ' +
        'hand studies" is describing a real learning journey. The specificity of the technical ' +
        'challenge and the effort invested are impossible to fabricate.',
      examples: [
        'Spent a full year mastering oil glazing technique — final piece took 40+ hours across 12 transparent layers',
        'Rewrote all dialogue in novel after mentor pointed out every character sounded the same — 3 months of eavesdropping and voice journals',
        'Built darkroom in basement; mastered silver gelatin printing through 200+ failed test strips before consistent results',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student has grappled with the technical demands of their craft. They understand that ' +
        'mastery takes focused practice, not just natural talent. This discipline translates ' +
        'directly to academic environments.',
    },
    {
      id: 'ac_pow_community_building',
      pattern:
        'Student created or sustained a creative community — writing group, art collective, ' +
        'open mic series, zine — that brought other artists together.',
      whyItProves:
        'Building creative community requires both artistic credibility (others trust your judgment) ' +
        'and organizational skill (logistics of regular events). A student who ran a weekly writing ' +
        'workshop for a year has demonstrated sustained commitment to their craft community, ' +
        'not just their personal portfolio.',
      examples: [
        'Founded weekly open mic at local cafe — ran 45 events over 2 years, featuring 120+ student writers and musicians',
        'Created student art collective of 8 artists; organized 3 group exhibitions and produced quarterly zine with 200 copies per issue',
        'Started peer writing workshop meeting biweekly; 15 members, 4 went on to win Scholastic Writing Awards',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student is not just an artist — they are an arts leader who elevates their community. ' +
        'AOs value this combination of creative skill and community-building initiative.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'ac_dt_tools_to_work',
      transformType: 'name_drop_to_impact',
      before: 'Used Adobe Photoshop and Illustrator to create digital artwork and illustrations for various projects',
      after: 'Illustrated 24 editorial pieces for school newspaper; 3 selected for regional Scholastic Art Awards submission',
      explanation:
        'Software names are invisible to AOs. The reader wants to see the creative OUTPUT ' +
        '(24 editorial pieces), the context (newspaper), and external validation (Scholastic). ' +
        'The tools used are implied by the quality and context of the work.',
      charsBefore: 92,
      charsAfter: 96,
      principle: 'Tools are invisible; creative output is everything.',
    },
    {
      id: 'ac_dt_hobby_to_practice',
      transformType: 'generic_to_specific',
      before: 'Enjoy painting and drawing in free time; maintain personal sketchbook and digital portfolio',
      after: 'Completed 30-piece oil portrait series over 2 years; 5 exhibited at community gallery, 2 sold at annual art walk',
      explanation:
        '"Enjoy painting" describes a hobby. A specific body of work (30 portraits, oil, 2 years) ' +
        'with external outcomes (gallery exhibition, sales) describes a serious artistic practice. ' +
        'The difference is night and day for AOs.',
      charsBefore: 85,
      charsAfter: 103,
      principle: 'Hobbies are what you do. Art practice is what you produce and how the world responds.',
    },
    {
      id: 'ac_dt_claim_to_evidence',
      transformType: 'claim_to_evidence',
      before: 'Talented and creative artist with a unique personal style and passion for visual storytelling',
      after: 'Gold Key at Scholastic Art Awards for graphic novel excerpt; accepted to RISD Pre-College from 2,800 applicants',
      explanation:
        '"Talented and creative" is a claim. Gold Key and RISD acceptance are verifiable evidence. ' +
        'AOs will conclude the student is talented from the evidence — self-description is never ' +
        'necessary and often counterproductive.',
      charsBefore: 87,
      charsAfter: 105,
      principle: 'Never describe yourself as talented. Show evidence and let the reader draw the conclusion.',
    },
    {
      id: 'ac_dt_passive_to_active',
      transformType: 'passive_to_active',
      before: 'Member of school art club and literary magazine; contributed artwork and writing to publications',
      after: 'Editor of literary magazine — reviewed 400 submissions, selected 20; my cover art chosen for 3 consecutive issues',
      explanation:
        '"Member" and "contributed" signal passive involvement. "Editor," "reviewed," and ' +
        '"selected" signal leadership and curatorial judgment. Adding specific quantities ' +
        '(400 submissions, 20 selected, 3 covers) grounds the claim.',
      charsBefore: 88,
      charsAfter: 107,
      principle: 'Move from "member who contributed" to "leader who curated." Your role claim is in your verb.',
    },
    {
      id: 'ac_dt_metrics_to_validation',
      transformType: 'jargon_to_outcome',
      before: 'Created art Instagram with 3,000 followers; post daily digital illustrations in anime and fantasy style',
      after: 'Daily illustration practice for 2 years (700+ pieces); work selected for emerging artists exhibit at county arts center',
      explanation:
        'Social media metrics are not artistic validation. Transform follower counts into ' +
        'the discipline they represent (700+ pieces, 2 years) and add professional-world ' +
        'validation (juried exhibit). The commitment is the story, not the platform.',
      charsBefore: 93,
      charsAfter: 103,
      principle: 'Replace vanity metrics (followers) with discipline metrics (pieces) and professional validation.',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'Exhibited', 'Published', 'Curated', 'Commissioned', 'Premiered',
        'Founded', 'Illustrated', 'Composed', 'Produced', 'Created',
      ],
      context:
        'Power verbs in arts signal professional-level creative output and external validation. ' +
        '"Exhibited" implies selection by a curator. "Published" implies editorial acceptance. ' +
        '"Commissioned" implies commercial demand. These verbs position the student as a ' +
        'working artist, not a hobbyist.',
      exampleUsage:
        'Exhibited 6 oil paintings at juried county art show; 2 pieces selected for traveling exhibition',
    },
    {
      tier: 'standard',
      verbs: [
        'Designed', 'Wrote', 'Painted', 'Directed', 'Photographed',
        'Edited', 'Submitted', 'Completed', 'Performed', 'Organized',
      ],
      context:
        'Standard verbs describe solid creative work but need specific objects, quantities, and ' +
        'recognition to differentiate. "Wrote" needs "85,000-word novel." "Painted" needs ' +
        '"20-piece series exhibited at X." Without specifics, these verbs are generic.',
      exampleUsage:
        'Wrote and revised 85,000-word YA novel over 18 months; submitted to 5 literary agents',
    },
    {
      tier: 'weak',
      verbs: [
        'Enjoyed', 'Explored', 'Practiced', 'Learned', 'Dabbled',
        'Participated', 'Contributed', 'Helped', 'Expressed', 'Shared',
      ],
      context:
        'Weak verbs in arts signal hobby-level involvement. "Enjoyed painting" and "explored ' +
        'different media" describe personal leisure, not artistic achievement. "Participated in ' +
        'art club" and "contributed to literary magazine" are maximally vague. Replace with ' +
        'what was CREATED, EXHIBITED, or PUBLISHED.',
      exampleUsage:
        'Avoid: "Explored various art styles and enjoyed creative expression" — replace with specific work and recognition',
    },
  ],

  roleExpertise: [
    {
      role: 'Visual Artist (painter, sculptor, photographer, digital)',
      expectedSignals: [
        'Describes a body of work with quantity and range of media or subjects',
        'References external exhibition, competition, or portfolio review',
        'Articulates artistic growth or thematic development over time',
        'Names specific competitions or awards with level of recognition',
      ],
      differentiators: [
        'Juried show acceptance or gallery exhibition (work evaluated by professional curators)',
        'Scholastic Gold Key or national-level competition recognition',
        'Commissioned work from organizations, businesses, or individuals',
        'Portfolio acceptance to competitive pre-college or art school program',
        'Work acquired by institution or collector',
      ],
      overclaimingRisks: [
        'Listing social media metrics as artistic validation',
        'Describing school art class projects as a "portfolio"',
        'Claiming "gallery exhibition" for a hallway display at school',
        'Describing teacher-assigned projects as personal creative vision',
      ],
      authenticPatterns: [
        'Describes specific pieces or series with subject matter and technique',
        'References the revision/creation process with honest challenges',
        'Mentions external feedback that shaped artistic development',
        'Distinguishes between school assignments and personal artistic projects',
      ],
    },
    {
      role: 'Creative Writer (fiction, poetry, nonfiction, playwright)',
      expectedSignals: [
        'Describes completed works with word count or scope',
        'References submission to competitions or literary journals',
        'Discusses revision process and editorial feedback',
        'Shows range across forms or sustained depth in one genre',
      ],
      differentiators: [
        'Publication in recognized literary journal (not self-published)',
        'Scholastic Writing Award at regional or national level',
        'Completed full-length work (novel, play, poetry collection)',
        'Literary agent interest or professional editorial feedback',
        'Named literary award or fellowship',
      ],
      overclaimingRisks: [
        'Claiming "published author" for self-published or blog content',
        'Equating Wattpad reads with editorial acceptance',
        'Describing a school essay as "creative nonfiction" without external publication',
        'Listing incomplete projects as completed works',
      ],
      authenticPatterns: [
        'References specific revision cycles and word counts',
        'Discusses submission history honestly (including rejections)',
        'Can name specific writers who influenced their work',
        'Describes the process of developing a personal voice',
      ],
    },
    {
      role: 'Literary Magazine / Art Publication Editor',
      expectedSignals: [
        'Quantifies submissions reviewed and pieces selected',
        'Describes editorial criteria and selection process',
        'References publication output (issues produced, distribution)',
        'Shows both creative and organizational leadership',
      ],
      differentiators: [
        'Transformed the publication (redesign, new section, expanded distribution)',
        'Publication won school press or literary magazine competition',
        'Recruited and mentored staff writers/artists',
        'Established partnerships with community organizations for distribution or content',
      ],
      overclaimingRisks: [
        'Claiming "editor" for a minor role on a large staff',
        'Attributing publication quality improvements solely to own leadership',
        'Describing a one-time publication as an ongoing literary magazine',
      ],
      authenticPatterns: [
        'Describes specific editorial decisions and their rationale',
        'Quantifies both submissions received and acceptance rate',
        'Discusses challenges of running a creative publication',
        'Credits contributing writers and artists',
      ],
    },
    {
      role: 'Filmmaker / Animator',
      expectedSignals: [
        'Describes completed films with runtime, format, and subject',
        'References film festivals submitted to or screened at',
        'Discusses technical aspects (cinematography, editing, sound design)',
        'Shows collaborative leadership (directing crew, managing production)',
      ],
      differentiators: [
        'Film screened at recognized festival (regional or national)',
        'Won film competition or received jury recognition',
        'Commissioned to create video content for organization',
        'Production involved community collaboration or social impact',
      ],
      overclaimingRisks: [
        'Describing class video projects as "films"',
        'Listing editing software as filmmaking credentials',
        'Claiming "director" for a group project without creative control',
        'Equating YouTube views with festival recognition',
      ],
      authenticPatterns: [
        'Describes specific films with subject, runtime, and audience',
        'References the production process with honest challenges',
        'Discusses creative vision and how it evolved during production',
        'Mentions collaboration with cast/crew and managing creative differences',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'Scholastic Gold Key / Silver Key / American Visions / American Voices',
      whyItsTheException:
        'Scholastic award levels ARE the achievement. "Gold Key" immediately communicates ' +
        'the level of recognition to any AO who reads applications. The specific award level ' +
        '(Honorable Mention < Silver Key < Gold Key < National Medal < American Visions/Voices) ' +
        'is a precise calibration of achievement. Omitting the level name would lose critical ' +
        'information that AOs use to evaluate.',
      example:
        'Scholastic Art Gold Key in photography, NE region; American Visions nominee 2025 — exhibited at Carnegie Hall',
    },
    {
      pattern: 'Gallery name for juried/professional venue',
      whyItsTheException:
        'When the venue IS the validation, naming it matters. "Exhibited at the Smithsonian" or ' +
        '"shown at a local community center" communicate very different achievement levels. ' +
        'For professional venues (museums, recognized galleries, established art centers), ' +
        'the venue name IS the credential — it tells AOs the level of curatorial gatekeeping ' +
        'the work passed through.',
      example:
        'Solo show at Agora Gallery, NYC — 12 mixed-media pieces exploring immigrant identity; 3 acquired by private collectors',
    },
    {
      pattern: 'Publication name for recognized literary journal',
      whyItsTheException:
        'The publication name IS the signal of quality. "Published in The Adroit Journal" tells ' +
        'AOs that editors who routinely publish MFA graduates selected a high school student\'s ' +
        'work (3% acceptance rate). "Published in a journal" without the name loses the entire ' +
        'calibration. Named publications are verifiable and their selectivity is known.',
      example:
        'Poem published in The Adroit Journal (3% acceptance); selected by guest editor Claudia Rankine',
    },
    {
      pattern: 'Pre-college program name (RISD, SAIC, Pratt, Interlochen)',
      whyItsTheException:
        'The institution name IS the credential. "Accepted to RISD Pre-College" communicates ' +
        'that faculty at the #1-ranked art school in the US evaluated this student\'s portfolio ' +
        'and found it worthy. Generic "accepted to pre-college art program" loses all calibration. ' +
        'The institution\'s reputation validates the student\'s portfolio quality.',
      example:
        'Portfolio accepted to RISD Pre-College (28% acceptance) — intensive study in painting and printmaking',
    },
  ],
};
