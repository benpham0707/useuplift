/**
 * Expertise Signaling Library — Performing Arts
 *
 * Covers: Instrumental music (classical, jazz, contemporary), vocal music
 * (choir, a cappella, solo), theater/drama (acting, directing, tech theater),
 * dance (ballet, modern, hip-hop, cultural), film/media production.
 *
 * Key insight for this domain: Performing arts are among the most inflated
 * activity categories. "First chair," "lead role," and "studied since age 5"
 * appear in tens of thousands of applications. AOs have finely calibrated BS
 * detectors for performing arts claims because the gap between school-level
 * and genuinely competitive achievement is enormous. The strongest descriptions
 * show SELECTION CONTEXT (how many auditioned?), AUDIENCE SCALE, and
 * CREATIVE OWNERSHIP rather than role titles or repertoire names.
 *
 * Critical context: Pay-to-play performance opportunities (Carnegie Hall
 * recitals, European tours, "international" festivals) are well-known to AOs.
 * Naming a prestigious venue without selectivity context can actually HURT
 * credibility.
 *
 * Sources: AO blogs from Juilliard, Northwestern, USC Thornton, NYU Tisch
 * admissions; Sara Harberson insights; National YoungArts Foundation criteria;
 * NFHS participation data; All-State/All-National selection processes.
 */

import type { ExpertiseDomain } from '../types';

export const PERFORMING_ARTS_DOMAIN: ExpertiseDomain = {
  domainId: 'performing_arts',
  label: 'Performing Arts',
  overview:
    'Performing arts descriptions are among the most inflated in college applications. ' +
    'AOs read thousands of "first chair" and "lead role" claims and have learned to ' +
    'discount them unless accompanied by selection context, audience scale, or creative ' +
    'ownership. The strongest descriptions contextualize achievement (selected from how many? ' +
    'what level ensemble? what audience size?) rather than listing role titles or piece names. ' +
    'Pay-to-play venues and vanity performances are well-known traps that can damage credibility.',

  aoExpectations: {
    whatRegisters: [
      'Selection context showing competitiveness ("selected from 400 auditions", "1 of 6 statewide")',
      'Ensemble level that contextualizes achievement (school vs. regional vs. all-state vs. national)',
      'Creative ownership — composing, arranging, choreographing, directing — not just performing',
      'Teaching or mentoring others, especially with quantified student outcomes',
      'Growth trajectory showing progressive achievement (ensemble → section leader → soloist)',
      'Community impact through performances that served a purpose beyond the stage',
    ],
    whatAOsSeeThrough: [
      'Listing piece names or repertoire (Rachmaninoff, Hamlet) without contextualizing the performance',
      '"Studied since age 5" — duration of training is not an achievement',
      '"Performed at Carnegie Hall" without specifying whether it was a curated or pay-to-play event',
      '"First chair" at school level presented as if it were a regional or national distinction',
      'Listing multiple roles or pieces as if quantity equals quality',
      '"Classical training" as a credential — training is preparation, not achievement',
    ],
    goldenQuestion:
      'Was this student selected by someone with standards, or did they simply sign up? ' +
      'How competitive was the selection, and what did they CREATE — not just perform?',
    readingTimeContext:
      'AOs spend ~10 seconds per activity. Performing arts descriptions that open with ' +
      'piece names, training duration, or instrument type waste the critical first impression ' +
      'on information that doesn\'t differentiate. Lead with the most selective achievement ' +
      'or the most impressive creative contribution.',
    competitiveContext:
      'Over 3.5 million US students participate in school music programs. All-State musicians ' +
      'represent roughly the top 1-2% in each state. All-National (NAfME) is the top ~0.1%. ' +
      'YoungArts finalists are ~150 nationally. School theater involves ~1.5 million students. ' +
      'AOs calibrate accordingly — school-level achievements need context to register.',
  },

  realExpertiseSignals: [
    {
      id: 'pa_selection_context',
      pattern: 'audition_selectivity',
      description: 'Specifying how competitive the selection process was',
      whyItWorks:
        'Selection context is the single most important signal in performing arts. ' +
        '"First chair" means nothing without knowing if 5 or 500 people auditioned. ' +
        '"Selected from 200 auditions" immediately communicates the achievement level ' +
        'without requiring the reader to know anything about the ensemble.',
      examples: [
        'Selected from 340 auditions for regional youth orchestra',
        '1 of 8 chosen statewide for All-State Jazz Ensemble',
        'Cast as lead from 180 auditions across tri-county area',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'selected from', 'chosen from', 'auditions', 'out of', '1 of',
        'applicants', 'candidates', 'statewide', 'nationwide',
      ],
    },
    {
      id: 'pa_ensemble_level',
      pattern: 'tiered_ensemble_context',
      description: 'Identifying the ensemble level within a recognized hierarchy',
      whyItWorks:
        'Music has clear, universally recognized tiers: school → district/regional → ' +
        'county → all-state → all-national → professional. Naming the tier level ' +
        'provides instant calibration. "All-State Orchestra" communicates more in ' +
        '3 words than a paragraph about school orchestra accomplishments.',
      examples: [
        'All-State Orchestra, principal cello (2 consecutive years)',
        'NAfME All-National Honor Ensemble, 1 of 120 selected nationwide',
        'Regional Youth Symphony first violin; performed at Lincoln Center',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'all-state', 'all-national', 'NAfME', 'regional', 'youth symphony',
        'honor ensemble', 'honor orchestra', 'honor band', 'district',
        'county', 'interlochen', 'conservatory',
      ],
    },
    {
      id: 'pa_creative_ownership',
      pattern: 'original_creation',
      description: 'Creating original work — composing, arranging, choreographing, directing',
      whyItWorks:
        'Performing others\' work demonstrates skill; creating original work demonstrates ' +
        'artistic vision and intellectual depth. AOs at arts-focused programs actively seek ' +
        'creative ownership because it predicts who will be a contributor to the program, ' +
        'not just a participant.',
      examples: [
        'Composed 15-minute orchestral piece premiered by school symphony (60 musicians)',
        'Choreographed 3 original works performed at regional dance showcase',
        'Arranged jazz standards for 18-piece big band; performed at state jazz festival',
        'Wrote, directed, and produced 20-minute film screened at 3 student film festivals',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'composed', 'composed for', 'arranged', 'choreographed', 'directed',
        'wrote', 'original', 'premiered', 'created', 'produced',
        'score', 'composition', 'arrangement',
      ],
    },
    {
      id: 'pa_audience_scale',
      pattern: 'performance_reach',
      description: 'Quantifying audience size or performance impact',
      whyItWorks:
        'Audience size provides immediate scale context that AOs can evaluate without ' +
        'domain expertise. Performing for 2,000 at a state arts festival is objectively ' +
        'impressive regardless of the specific art form. It also shows the student ' +
        'is comfortable with high-stakes public performance.',
      examples: [
        'Performed for 2,500 at state arts festival opening ceremony',
        'Led ensemble in 12 community concerts reaching 3,000+ audience members',
        'Solo performance at governor\'s inauguration (televised, 50,000 viewers)',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'impact',
      detectionKeywords: [
        'audience', 'performed for', 'viewers', 'attendees', 'sold out',
        'seats', 'concert hall', 'theater', 'festival',
      ],
    },
    {
      id: 'pa_teaching_multiplier',
      pattern: 'arts_pedagogy',
      description: 'Teaching or mentoring other performers with quantified outcomes',
      whyItWorks:
        'Teaching in the arts requires deep knowledge — you cannot teach violin technique ' +
        'you don\'t understand. When students of the applicant achieve competitive success, ' +
        'it validates the teacher\'s expertise. This is the strongest proof-of-mastery signal.',
      examples: [
        'Private piano instructor for 8 students; 3 placed at regional competition',
        'Section leader mentoring 6 cellists; section improved from 3rd to 1st rating at festival',
        'Taught beginner dance classes for 40 children at community center for 2 years',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'taught', 'instructor', 'mentored', 'coached', 'section leader',
        'students', 'lessons', 'tutored', 'trained',
      ],
    },
    {
      id: 'pa_competition_placement',
      pattern: 'adjudicated_achievement',
      description: 'Placement in juried or adjudicated competitions with context',
      whyItWorks:
        'Adjudicated competitions provide external validation by credentialed judges. ' +
        'Unlike school ensemble roles (which may reflect politics or seniority), ' +
        'competition placements are merit-based and comparable across applicants.',
      examples: [
        'YoungArts finalist in Classical Music (top 150 nationally)',
        '1st place, MTNA state piano competition; advanced to regional',
        'Gold medal at NYSSMA solo festival, Level 6 (highest difficulty)',
      ],
      signalStrength: 'strong',
      affectsDimension: 'specificity',
      detectionKeywords: [
        'competition', 'placed', 'finalist', 'winner', 'gold', 'silver',
        'superior rating', 'NYSSMA', 'MTNA', 'YoungArts', 'concerto competition',
        'juried', 'adjudicated', 'festival', 'solo and ensemble',
      ],
    },
    {
      id: 'pa_growth_trajectory',
      pattern: 'progressive_achievement',
      description: 'Documented progression through ensemble ranks or skill levels',
      whyItWorks:
        'A clear growth arc — ensemble member to section leader to principal to soloist ' +
        '— shows both sustained commitment and increasing recognition of ability. AOs ' +
        'value the trajectory as much as the destination because it predicts continued growth.',
      examples: [
        'Progressed from 2nd violin to concertmaster in 3 years',
        'Advanced from corps dancer to soloist to choreographer over 4 seasons',
        'Grew from ensemble cast to lead roles in 3 consecutive productions',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'authenticity',
      detectionKeywords: [
        'progressed', 'advanced', 'promoted', 'grew from', 'to',
        'trajectory', 'year 1', 'year 2', 'first year', 'by senior year',
      ],
    },
    {
      id: 'pa_professional_collaboration',
      pattern: 'professional_context',
      description: 'Working alongside or being selected by professional artists',
      whyItWorks:
        'When a professional musician, choreographer, or director selects a student ' +
        'to work with them, it provides credentialed external validation. This is ' +
        'fundamentally different from school-level selection by a teacher.',
      examples: [
        'Selected by guest conductor to perform solo with city professional orchestra',
        'Invited to perform at jazz club with professional quartet (3 weekend residencies)',
        'Choreography mentored by Alvin Ailey company member for regional showcase',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'professional', 'guest artist', 'master class', 'residency',
        'invited by', 'selected by', 'collaborated with', 'mentored by',
      ],
    },
    {
      id: 'pa_festival_selection',
      pattern: 'curated_festival_inclusion',
      description: 'Selection for curated festivals, workshops, or intensive programs',
      whyItWorks:
        'Competitive summer programs (Interlochen, Tanglewood, Aspen, Walnut Hill) ' +
        'and festival invitations represent independent validation by professionals ' +
        'outside the student\'s school. The selectivity of these programs is well-known ' +
        'in admissions circles.',
      examples: [
        'Accepted to Interlochen Arts Camp on merit scholarship (15% acceptance rate)',
        'Selected for Tanglewood Institute, performing with Boston Pops',
        'Walnut Hill School summer intensive, 1 of 30 accepted from 200 applicants',
      ],
      signalStrength: 'strong',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'Interlochen', 'Tanglewood', 'Aspen', 'Walnut Hill', 'Brevard',
        'summer intensive', 'festival', 'accepted to', 'scholarship',
        'merit', 'arts camp',
      ],
    },
    {
      id: 'pa_community_service_through_art',
      pattern: 'art_as_service',
      description: 'Using performing arts skills for community benefit',
      whyItWorks:
        'Performing at hospitals, senior centers, shelters, or fundraisers shows that ' +
        'art is not just a personal pursuit but a tool for community impact. This signals ' +
        'maturity and purpose that AOs value beyond technical skill.',
      examples: [
        'Organized 20 concerts at hospitals and senior centers, reaching 800+ residents',
        'Founded Music for All program providing free lessons to 30 underserved students',
        'Performed benefit concerts raising $12,000 for local arts education nonprofit',
      ],
      signalStrength: 'strong',
      affectsDimension: 'impact',
      detectionKeywords: [
        'hospital', 'senior center', 'community', 'benefit', 'fundraiser',
        'free lessons', 'underserved', 'nonprofit', 'outreach', 'service',
      ],
    },
    {
      id: 'pa_tech_theater_ownership',
      pattern: 'technical_theater_leadership',
      description: 'Technical theater roles showing creative and logistical ownership',
      whyItWorks:
        'Tech theater (lighting design, set design, stage management, sound engineering) ' +
        'demonstrates problem-solving, project management, and collaborative skills that ' +
        'AOs value highly. These roles are often more impressive than acting roles because ' +
        'they show engineering-like thinking applied to creative contexts.',
      examples: [
        'Designed lighting for 6 productions; managed $8,000 technical budget',
        'Stage managed 4 productions coordinating 40+ cast/crew members',
        'Built 12 set pieces for spring musical; designed rotating stage platform',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'designed', 'lighting', 'set design', 'stage manager', 'stage managed',
        'sound', 'technical director', 'built', 'constructed', 'rigging',
        'production', 'budget',
      ],
    },
    {
      id: 'pa_film_festival_selection',
      pattern: 'curated_screening',
      description: 'Student films selected for juried or curated festivals',
      whyItWorks:
        'Film festival selections are merit-based and externally validated. Unlike ' +
        'uploading to YouTube, having work selected for screening by a festival jury ' +
        'provides credentialed evaluation of creative quality.',
      examples: [
        'Short film screened at 4 student film festivals; won Best Cinematography at 2',
        'Documentary selected for All American High School Film Festival (top 5% of submissions)',
        'Music video commissioned by local band; 50,000+ views and festival screening',
      ],
      signalStrength: 'moderate',
      affectsDimension: 'differentiation',
      detectionKeywords: [
        'film festival', 'screened', 'selected', 'premiered', 'cinematography',
        'documentary', 'short film', 'best picture', 'jury',
      ],
    },
  ],

  nameDropTraps: [
    {
      id: 'pa_piece_name_listing',
      pattern: 'Performed Rachmaninoff / Played Chopin Ballade / Danced Swan Lake',
      whyStudentsUseIt:
        'Students believe that naming difficult repertoire demonstrates skill level. ' +
        'In their world, "Rachmaninoff Concerto No. 3" is synonymous with "extremely ' +
        'difficult," so they expect AOs to make the same association.',
      whyItFails:
        'AOs are not music professors. The difficulty of a specific piece is not common ' +
        'knowledge. A piece name wastes 20-40 characters that could describe the CONTEXT ' +
        'of the performance (venue, selection process, audience) which IS universally ' +
        'understandable. Additionally, choosing difficult repertoire and performing it ' +
        'well are different things.',
      betterAlternative:
        'Describe the context, not the content. "Performed concerto as soloist with ' +
        'regional orchestra (selected from 120 auditions)" communicates more than ' +
        'any piece name.',
      example: {
        nameDrop: 'Performed Rachmaninoff Piano Concerto No. 3 at school recital',
        improved: 'Soloist with regional orchestra, selected from 120 auditions; performed for 1,200',
        whatChanged:
          'Removed the piece name (meaningless to AOs) and "school recital" (low-stakes ' +
          'context). Added selection competitiveness, ensemble level, and audience size.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'Rachmaninoff', 'Chopin', 'Liszt', 'Beethoven', 'Mozart', 'Bach',
        'Concerto No.', 'Sonata', 'Ballade', 'Etude', 'Nocturne', 'opus',
        'Swan Lake', 'Nutcracker', 'Giselle', 'repertoire',
      ],
    },
    {
      id: 'pa_training_duration',
      pattern: 'Studied piano since age 5 / 12 years of classical training',
      whyStudentsUseIt:
        'Students equate years of training with expertise. They assume AOs will be ' +
        'impressed by early start and long duration.',
      whyItFails:
        'Duration of training is not an achievement — it\'s a circumstance. ' +
        'It often signals privilege (parents who could afford lessons) more than ' +
        'talent. AOs care about what you\'ve ACHIEVED with that training, not how ' +
        'long you\'ve been doing it. 12 years of lessons with no competitive results ' +
        'is less impressive than 3 years with a state championship.',
      betterAlternative:
        'Replace duration with the highest-level achievement that resulted from ' +
        'the training. "12 years of piano" → "All-State pianist, concerto competition winner."',
      example: {
        nameDrop: 'Studied classical violin since age 4. Thirteen years of dedicated practice.',
        improved: 'All-State violinist 3 years; concertmaster of regional youth orchestra (80 members)',
        whatChanged:
          'Removed training duration (which the Common App years section already shows). ' +
          'Added the highest competitive achievement and ensemble role with context.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 30,
      detectionKeywords: [
        'since age', 'years of', 'training', 'studied since', 'dedicated',
        'practice', 'classical training', 'began playing', 'started at age',
      ],
    },
    {
      id: 'pa_carnegie_hall_trap',
      pattern: 'Performed at Carnegie Hall / Played at Lincoln Center',
      whyStudentsUseIt:
        'Carnegie Hall is the most famous concert venue in the world. Students assume ' +
        'performing there is inherently impressive and self-explanatory.',
      whyItFails:
        'AOs know that many Carnegie Hall performances are pay-to-play — organizations ' +
        'charge $50-150 per student for group recitals in Weill Recital Hall or Zankel Hall. ' +
        'Without specifying the CONTEXT (solo recital? concerto competition winner? ' +
        'youth orchestra selected by audition?), naming Carnegie Hall can actually ' +
        'HURT credibility because AOs may assume it was a paid opportunity.',
      betterAlternative:
        'Only name prestigious venues if the SELECTION PROCESS was competitive. ' +
        '"Won concerto competition; performed with orchestra at Carnegie Hall" ' +
        'provides the missing context that makes it meaningful.',
      example: {
        nameDrop: 'Performed at Carnegie Hall in New York City',
        improved: 'Won concerto competition (80 auditions); performed as soloist at Carnegie Hall',
        whatChanged:
          'Added the selection mechanism (concerto competition), field size, and role. ' +
          'Now AOs know this was a competitive achievement, not a paid recital.',
      },
      prevalence: 'common',
      typicalCharWaste: 15,
      detectionKeywords: [
        'Carnegie Hall', 'Lincoln Center', 'Kennedy Center', 'Weill',
        'Zankel', 'performed at', 'played at', 'famous venue',
      ],
    },
    {
      id: 'pa_first_chair_without_context',
      pattern: 'First chair violin / Principal flute',
      whyStudentsUseIt:
        'First chair is the highest position in a section and students assume it ' +
        'communicates top-tier ability across all contexts.',
      whyItFails:
        'First chair at a school of 200 students may mean first among 4 violinists. ' +
        'First chair at All-State means first among hundreds. Without ensemble-level ' +
        'context, the title is meaningless. AOs see "first chair" thousands of times ' +
        'and mentally discount it unless the ensemble is specified.',
      betterAlternative:
        'Always pair the position with the ensemble level and selection context. ' +
        '"First chair, All-State Orchestra" or "Principal violin, regional youth symphony ' +
        '(selected from 150 auditions)."',
      example: {
        nameDrop: 'First chair violinist in the school orchestra',
        improved: 'Principal violin, county honor orchestra (selected from 150 auditions, 4-year member)',
        whatChanged:
          'Upgraded "school orchestra" to the actual highest-level ensemble. Added ' +
          'selection context (150 auditions) that proves the achievement is competitive.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 10,
      detectionKeywords: [
        'first chair', 'principal', 'section leader', 'concertmaster',
        'first seat', 'lead', 'chair',
      ],
    },
    {
      id: 'pa_lead_role_without_context',
      pattern: 'Played the lead role / Starred as [character name]',
      whyStudentsUseIt:
        'Landing a lead role feels like a major achievement, and students assume ' +
        'the role title communicates the accomplishment.',
      whyItFails:
        'Every school with a theater program has a lead. AOs read "lead role" in ' +
        'thousands of applications. Without knowing the production scale, audition ' +
        'competitiveness, or performance context, "lead role" communicates nothing ' +
        'beyond participation. Character names waste characters unless the AO ' +
        'happens to know the show.',
      betterAlternative:
        'Describe the production context, not the character. Number of shows, ' +
        'audience size, audition competitiveness, and any external recognition ' +
        '(festival selection, reviews, awards) are far more valuable.',
      example: {
        nameDrop: 'Played the lead role of Elphaba in the school musical Wicked',
        improved: 'Lead in spring musical (cast from 90 auditions); 6 sold-out shows, 3,600 total audience',
        whatChanged:
          'Removed the character and show name. Added audition competitiveness, ' +
          'number of performances, and total audience — universal metrics of success.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'lead role', 'starred as', 'played', 'cast as', 'role of',
        'character', 'Hamlet', 'Elphaba', 'phantom', 'Juliet',
      ],
    },
    {
      id: 'pa_recital_attendance',
      pattern: 'Performed at recitals / Gave several concerts',
      whyStudentsUseIt:
        'Students view any performance as noteworthy and assume the act of performing ' +
        'publicly communicates dedication.',
      whyItFails:
        'Recitals are the baseline activity of music study — every piano/violin student ' +
        'performs at recitals. It\'s like a debater saying "spoke in rounds." ' +
        'Vague quantifiers ("several," "various," "multiple") add no information.',
      betterAlternative:
        'Only mention performances with specific context: invited performances, ' +
        'competitions, large audiences, or notable venues. "12 community concerts ' +
        'reaching 2,000+" is specific. "Performed at recitals" is empty.',
      example: {
        nameDrop: 'Performed at multiple recitals and concerts throughout the year',
        improved: 'Gave 14 public performances including 3 solo recitals; 800+ total audience',
        whatChanged:
          'Replaced vague "multiple recitals" with exact performance count, ' +
          'solo distinction, and cumulative audience size.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'recital', 'recitals', 'concerts', 'performed at', 'multiple',
        'several', 'various performances', 'throughout the year',
      ],
    },
    {
      id: 'pa_instrument_grade_level',
      pattern: 'ABRSM Grade 8 / RCM Level 10 / Reached highest grade',
      whyStudentsUseIt:
        'Grading systems (ABRSM, RCM, CM) provide clear progression milestones. ' +
        'Students see Grade 8 / Level 10 as the pinnacle and expect AOs to understand.',
      whyItFails:
        'Most AOs are not familiar with music examination grading systems. "ABRSM Grade 8" ' +
        'means nothing to a reader outside the music world. The characters spent explaining ' +
        'the grading system would be better spent on competitive achievements that translate ' +
        'without explanation.',
      betterAlternative:
        'Translate the grade into a universally understandable achievement. ' +
        'If Grade 8 enabled you to win a competition, lead your section, or perform ' +
        'advanced repertoire as a soloist, describe THAT instead.',
      example: {
        nameDrop: 'Achieved ABRSM Grade 8 in piano with distinction',
        improved: 'Advanced pianist: concerto competition winner, All-State selection 2 years',
        whatChanged:
          'Replaced an insider grading system with universally understood competitive ' +
          'achievements. Both convey "advanced level" but one requires domain knowledge.',
      },
      prevalence: 'common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'ABRSM', 'RCM', 'Grade 8', 'Level 10', 'distinction', 'merit',
        'certificate of merit', 'CM Level', 'examination',
      ],
    },
    {
      id: 'pa_dance_style_listing',
      pattern: 'Trained in ballet, jazz, modern, contemporary, hip-hop',
      whyStudentsUseIt:
        'Students believe listing multiple dance styles shows breadth and versatility.',
      whyItFails:
        'Listing styles is a menu, not an achievement. AOs don\'t know what proficiency ' +
        'in each style means. Five styles trained casually is less impressive than ' +
        'one style performed competitively. The characters spent listing styles ' +
        'could describe a single achievement that proves versatility.',
      betterAlternative:
        'Focus on the highest achievement in any style and add context. ' +
        '"Lead dancer in regional ballet company" beats "trained in ballet, jazz, modern."',
      example: {
        nameDrop: 'Trained in ballet, contemporary, jazz, lyrical, and hip-hop for 10 years',
        improved: 'Lead dancer, regional ballet company; choreographed 3 original pieces for showcase',
        whatChanged:
          'Replaced the style list and duration with the most competitive role and ' +
          'creative ownership. Shows both excellence and artistic vision.',
      },
      prevalence: 'common',
      typicalCharWaste: 35,
      detectionKeywords: [
        'trained in', 'ballet', 'contemporary', 'jazz', 'hip-hop', 'lyrical',
        'modern', 'tap', 'styles', 'dance styles',
      ],
    },
    {
      id: 'pa_show_title_listing',
      pattern: 'Appeared in Grease, West Side Story, Les Mis, and The Sound of Music',
      whyStudentsUseIt:
        'Students want to show the breadth of their theatrical experience by listing ' +
        'every production they\'ve been in.',
      whyItFails:
        'Show titles are meaningless without context — role, selection competitiveness, ' +
        'audience, and production quality. Listing 4 shows uses 50+ characters to communicate ' +
        'only "I was in school theater," which AOs already infer from the activity listing. ' +
        'One show with full context is infinitely more valuable than four titles.',
      betterAlternative:
        'Feature your best role with full production context: audition competitiveness, ' +
        'number of performances, audience size, any external recognition.',
      example: {
        nameDrop: 'Appeared in Grease, West Side Story, Les Mis, and Oklahoma at school',
        improved: 'Lead in 4 productions; cast from 90+ auditions; 24 total shows to 7,200 audience',
        whatChanged:
          'Replaced show titles with aggregate metrics that prove scale and consistency. ' +
          'The number of productions (4) with audition competitiveness and total reach.',
      },
      prevalence: 'common',
      typicalCharWaste: 40,
      detectionKeywords: [
        'Grease', 'West Side Story', 'Les Mis', 'Oklahoma', 'Hamlet',
        'appeared in', 'performed in', 'production of', 'school play',
      ],
    },
    {
      id: 'pa_generic_passion_statement',
      pattern: 'Passionate about music / Love of the arts / Dedicated to dance',
      whyStudentsUseIt:
        'Students feel that expressing passion adds authenticity and emotional depth.',
      whyItFails:
        'Every performing arts applicant is passionate — that\'s why they do it. ' +
        'Passion is assumed; stating it wastes 20-30 characters on information that ' +
        'adds nothing. AOs want to see EVIDENCE of passion through achievements, ' +
        'not declarations of it.',
      betterAlternative:
        'Show passion through actions: "organized 20 community concerts" demonstrates ' +
        'passion far more powerfully than "passionate about music."',
      example: {
        nameDrop: 'Passionate musician dedicated to sharing the beauty of classical music',
        improved: 'Organized 15 free community concerts at senior centers and hospitals, reaching 600+',
        whatChanged:
          'Replaced emotional declaration with concrete action that PROVES the passion. ' +
          'The community concerts demonstrate dedication through evidence, not claims.',
      },
      prevalence: 'very_common',
      typicalCharWaste: 25,
      detectionKeywords: [
        'passionate', 'passion for', 'love of', 'dedicated to', 'devoted',
        'lifelong love', 'deep commitment', 'love for the arts',
      ],
    },
    {
      id: 'pa_european_tour_trap',
      pattern: 'Toured Europe / Performed in Italy / International tour',
      whyStudentsUseIt:
        'International performance sounds prestigious and worldly. Students assume ' +
        'performing abroad signals elite status.',
      whyItFails:
        'AOs know that most student "European tours" are pay-to-play travel programs ' +
        'where ensembles pay $3,000-5,000 per student to perform at empty churches ' +
        'and tourist venues. Without specifying the selection process or invitation ' +
        'mechanism, "toured Europe" can signal privilege, not talent.',
      betterAlternative:
        'Only mention international performances if the SELECTION was competitive. ' +
        '"Invited by Italian conservatory to perform" is meaningful. ' +
        '"Toured Italy with school ensemble" is not.',
      example: {
        nameDrop: 'Toured Italy and Austria with school orchestra, performing at historic venues',
        improved: 'Invited to perform at Vienna Musikverein through international youth competition (top 3)',
        whatChanged:
          'Replaced pay-to-play tour framing with a competitive selection mechanism. ' +
          'Now the international element proves achievement rather than budget.',
      },
      prevalence: 'occasional',
      typicalCharWaste: 20,
      detectionKeywords: [
        'toured', 'Europe', 'Italy', 'Austria', 'international tour',
        'performed abroad', 'historic venues', 'international',
      ],
    },
  ],

  proofOfWorkPatterns: [
    {
      id: 'pa_pow_audition_survival',
      pattern: 'Advancing through competitive audition rounds with specific numbers',
      whyItProves:
        'Audition processes are inherently meritocratic — you either pass or you don\'t. ' +
        'Specifying the number of applicants and rounds proves the achievement was earned ' +
        'through direct competition, not favoritism or seniority.',
      examples: [
        'Selected through 3-round audition process, advancing from 200 to 40 to 12 finalists',
        'Earned position through blind audition (behind screen); 1 of 4 selected from 80',
        'Callback for regional youth orchestra (180 initial auditions, 25 accepted)',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student survived a genuine competitive process. The specific numbers ' +
        'make the claim verifiable and credible.',
    },
    {
      id: 'pa_pow_performance_preparation',
      pattern: 'Describing the scale of preparation for a specific performance',
      whyItProves:
        'Only someone who actually prepared knows the hours involved. ' +
        '"Memorized 45 minutes of solo repertoire" or "rehearsed 200+ hours for spring production" ' +
        'reveals intimate knowledge of the preparation process.',
      examples: [
        'Prepared 45-minute solo recital program — 6 months of dedicated preparation',
        'Memorized 3 concerto movements for competition; practiced 15+ hours weekly',
        'Learned entire score by ear for pit orchestra when sheet music was unavailable',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student understands and can articulate the work behind the performance — ' +
        'they are not just a casual participant.',
    },
    {
      id: 'pa_pow_adjudicator_feedback',
      pattern: 'Incorporating specific feedback from professional adjudicators',
      whyItProves:
        'Only students who have participated in juried competitions receive written ' +
        'adjudicator feedback. Referencing and integrating this feedback shows ' +
        'active learning and professional development.',
      examples: [
        'Incorporated judge feedback on phrasing; improved from Silver to Gold rating in one year',
        'Adjudicator praised "exceptional interpretive maturity" — scored perfect marks on musicality',
        'Adapted technique based on master class feedback from [professional artist]',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'This student engages with expert feedback and uses it for growth — ' +
        'a learning disposition that predicts success in any rigorous program.',
    },
    {
      id: 'pa_pow_program_building',
      pattern: 'Creating or substantially growing an arts program or ensemble',
      whyItProves:
        'Building something from nothing — founding an a cappella group, starting a ' +
        'jazz combo, launching a film club — requires initiative, organization, and ' +
        'social skills that extend far beyond personal artistic ability.',
      examples: [
        'Founded school\'s first a cappella group; grew from 6 to 18 members; won regional competition',
        'Launched student film production club; produced 8 short films in first year',
        'Created chamber music program pairing advanced players with beginners; 24 participants',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student is a builder, not just a participant. They create opportunities ' +
        'for others and demonstrate entrepreneurial thinking within the arts.',
    },
    {
      id: 'pa_pow_technical_problem_solving',
      pattern: 'Solving specific technical challenges in performance or production',
      whyItProves:
        'Describing a specific technical problem and how it was solved reveals deep ' +
        'practical knowledge. "Redesigned the lighting plot when 3 instruments failed ' +
        'on opening night" proves hands-on expertise that cannot be faked.',
      examples: [
        'Redesigned sound system for outdoor venue; solved feedback issue affecting 4 prior productions',
        'Transposed orchestral parts to accommodate available instrumentation (no French horn available)',
        'Built custom rotating stage platform to solve scene transition challenges in small theater',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student solves real problems under pressure — the kind of practical ' +
        'intelligence that predicts success beyond the arts.',
    },
    {
      id: 'pa_pow_repertoire_breadth',
      pattern: 'Demonstrating versatility across styles or periods with context',
      whyItProves:
        'Versatility — performing Baroque and contemporary, or acting in comedy and ' +
        'drama — proves genuine skill rather than narrow specialization. When accompanied ' +
        'by results in each area, it shows adaptability.',
      examples: [
        'Won competitions in both classical piano and jazz improvisation in same season',
        'Cast in comedy (spring), drama (fall), and musical (winter) — selected in open auditions',
        'Performed Baroque concerto and commissioned contemporary piece on same program',
      ],
      expertiseLevel: 'advanced',
      aoInterpretation:
        'This student has genuine range — they\'re not a one-trick performer ' +
        'but someone who can adapt and grow across contexts.',
    },
    {
      id: 'pa_pow_audience_response',
      pattern: 'Documenting measurable audience response or external recognition',
      whyItProves:
        'Audience metrics (standing ovation, sold-out shows, media coverage, encores) ' +
        'provide external validation of performance quality. They\'re harder to fabricate ' +
        'than self-assessed quality claims.',
      examples: [
        '6 sold-out performances (300 seats each); reviewed in local newspaper',
        'Standing ovation at state arts festival; invited back as featured performer',
        'Performance video shared by school district; 15,000 views across platforms',
      ],
      expertiseLevel: 'intermediate',
      aoInterpretation:
        'The audience responded — this wasn\'t just a student obligation but ' +
        'a genuinely impactful performance.',
    },
    {
      id: 'pa_pow_cross_disciplinary',
      pattern: 'Combining performing arts with another domain for original work',
      whyItProves:
        'Using music to explore science, dance to address social justice, or theater to ' +
        'teach history demonstrates intellectual depth that transcends pure artistic skill. ' +
        'This is uniquely impressive because it shows the student sees arts as a tool, not just a talent.',
      examples: [
        'Composed music incorporating field recordings of endangered species for environmental exhibit',
        'Choreographed piece on immigration using oral histories from community interviews',
        'Directed student documentary combining theater and journalism on local housing crisis',
      ],
      expertiseLevel: 'expert',
      aoInterpretation:
        'This student connects arts to the world — they\'ll bring this integrative ' +
        'thinking to every class and community they join in college.',
    },
  ],

  descriptionTransforms: [
    {
      id: 'pa_transform_piece_to_context',
      transformType: 'name_drop_to_impact',
      before: 'Performed Chopin Ballade No. 4 at school recital',
      after: 'Concerto competition winner; performed as soloist with 60-piece youth orchestra',
      explanation:
        'Removed the piece name (uninformative to AOs) and "school recital" (low stakes). ' +
        'Added the competitive selection mechanism and ensemble context that communicates ' +
        'achievement level universally.',
      charsBefore: 48,
      charsAfter: 69,
      principle: 'Context over content — how you were selected matters more than what you played',
    },
    {
      id: 'pa_transform_duration_to_achievement',
      transformType: 'generic_to_specific',
      before: 'Studied violin for 12 years with classical training',
      after: 'All-State violinist 3 yrs; concertmaster, regional youth orchestra (80 musicians)',
      explanation:
        'Replaced training duration (redundant with Common App years) with the ' +
        'competitive achievements that training produced. Both entries imply advanced ' +
        'level, but only one proves it.',
      charsBefore: 50,
      charsAfter: 72,
      principle: 'Achievements over credentials — what did the training produce?',
    },
    {
      id: 'pa_transform_first_chair_context',
      transformType: 'generic_to_specific',
      before: 'First chair flute in the high school band',
      after: 'Principal flute, All-County Honor Band (selected from 200 auditions across 40 schools)',
      explanation:
        'Upgraded the ensemble to the highest level the student actually achieved. ' +
        'Added audition numbers and school count that prove competitive selection.',
      charsBefore: 41,
      charsAfter: 75,
      principle: 'Specify the ensemble level — school, county, all-state, and national are different universes',
    },
    {
      id: 'pa_transform_lead_role_context',
      transformType: 'claim_to_evidence',
      before: 'Played the lead in the school musical',
      after: 'Lead in musical (cast from 95 auditions); 8 shows, 4,800 total audience',
      explanation:
        'Kept the role claim but added three forms of evidence: audition competitiveness, ' +
        'performance count, and cumulative audience reach.',
      charsBefore: 38,
      charsAfter: 66,
      principle: 'Support every claim with evidence — audition numbers, show count, audience size',
    },
    {
      id: 'pa_transform_passion_to_action',
      transformType: 'claim_to_evidence',
      before: 'Passionate cellist dedicated to sharing music with the community',
      after: 'Organized 18 concerts at hospitals and shelters; taught cello to 12 underserved students',
      explanation:
        'Replaced the passion declaration with two concrete actions that PROVE passion ' +
        'more powerfully than any adjective could.',
      charsBefore: 58,
      charsAfter: 76,
      principle: 'Show passion through action, not words — let your deeds speak',
    },
    {
      id: 'pa_transform_venue_to_selectivity',
      transformType: 'name_drop_to_impact',
      before: 'Performed at Carnegie Hall in New York City',
      after: 'Won concerto competition (80 auditions); performed as soloist at Carnegie Hall',
      explanation:
        'Added the selection mechanism that proves the Carnegie Hall appearance was ' +
        'earned through competition, not a pay-to-play recital.',
      charsBefore: 42,
      charsAfter: 70,
      principle: 'Venues need selection context — how did you earn the stage?',
    },
    {
      id: 'pa_transform_passive_member',
      transformType: 'passive_to_active',
      before: 'Member of the school choir for four years',
      after: 'Section leader, varsity choir; trained 8 sopranos; choir won state festival gold rating',
      explanation:
        'Transformed passive membership into active contribution with three layers: ' +
        'leadership role, teaching impact, and ensemble achievement.',
      charsBefore: 40,
      charsAfter: 77,
      principle: 'Show what you DID in the ensemble, not just that you were IN it',
    },
    {
      id: 'pa_transform_style_list_to_achievement',
      transformType: 'jargon_to_outcome',
      before: 'Trained in ballet, jazz, contemporary, lyrical, and hip-hop dance',
      after: 'Lead dancer, regional company; choreographed 4 pieces performed at state showcase',
      explanation:
        'Replaced the style inventory with a competitive role and creative achievement. ' +
        'The single strongest achievement communicates more than five style names.',
      charsBefore: 57,
      charsAfter: 72,
      principle: 'One achievement in depth beats five styles in breadth',
    },
    {
      id: 'pa_transform_grade_to_result',
      transformType: 'jargon_to_outcome',
      before: 'Achieved ABRSM Grade 8 piano with distinction score of 140/150',
      after: 'Advanced pianist: state competition finalist, All-County Honor Recital soloist',
      explanation:
        'Replaced the insider grading system with universally understandable ' +
        'competitive achievements. Both communicate "advanced level" but one ' +
        'requires music education context.',
      charsBefore: 57,
      charsAfter: 67,
      principle: 'Translate insider credentials into universal achievements',
    },
    {
      id: 'pa_transform_tech_duties_to_achievement',
      transformType: 'duty_to_achievement',
      before: 'Responsible for lighting and sound for school theater productions',
      after: 'Designed lighting for 6 productions; managed $8K tech budget; trained crew of 10',
      explanation:
        'Replaced vague "responsible for" with specific scope (6 productions), ' +
        'financial responsibility ($8K), and team leadership (crew of 10).',
      charsBefore: 57,
      charsAfter: 72,
      principle: 'Duties become achievements when you add scope, scale, and leadership',
    },
    {
      id: 'pa_transform_film_generic_to_curated',
      transformType: 'generic_to_specific',
      before: 'Made short films and uploaded them to YouTube',
      after: 'Directed 5 short films; 2 screened at juried festivals; 1 won Best Student Film',
      explanation:
        'Replaced generic creation with specific output count, external validation ' +
        '(juried festival selection), and competitive recognition (award).',
      charsBefore: 43,
      charsAfter: 72,
      principle: 'External validation transforms hobby into credential — festivals, juries, awards',
    },
  ],

  verbHierarchy: [
    {
      tier: 'power',
      verbs: [
        'composed', 'choreographed', 'directed', 'premiered', 'soloed',
        'founded', 'arranged', 'commissioned', 'designed', 'conducted',
      ],
      context:
        'In performing arts, power verbs signal CREATIVE OWNERSHIP and selection-based ' +
        'distinction. "Composed," "choreographed," and "directed" show the student created ' +
        'rather than just performed. "Premiered" and "soloed" imply selection for a distinctive role. ' +
        '"Founded" shows institutional initiative.',
      exampleUsage:
        'Composed 15-minute orchestral piece; premiered by school symphony; choreographed 3 works for showcase',
    },
    {
      tier: 'standard',
      verbs: [
        'performed', 'auditioned', 'rehearsed', 'played', 'sang',
        'danced', 'acted', 'produced', 'recorded', 'arranged',
      ],
      context:
        'Standard verbs describe the core activity of performing arts — they are accurate ' +
        'but undifferentiating. "Performed" and "played" describe what every musician does. ' +
        'These verbs are fine as supporting language but should not headline the description.',
      exampleUsage:
        'Performed in 12 concerts and played violin in the school orchestra',
    },
    {
      tier: 'weak',
      verbs: [
        'participated', 'was a member of', 'attended', 'studied',
        'practiced', 'trained in', 'took lessons', 'was involved in',
        'helped with', 'assisted',
      ],
      context:
        'Weak verbs in performing arts describe PREPARATION or ATTENDANCE rather than ' +
        'achievement. "Studied," "practiced," and "trained" are input activities, not outputs. ' +
        '"Was a member of" and "participated" confirm only that the student was present. ' +
        'Every character spent on these verbs could instead describe what they achieved.',
      exampleUsage:
        'Studied piano and was a member of the school music program for four years',
    },
  ],

  roleExpertise: [
    {
      role: 'Section Leader / Concertmaster / Drum Major',
      expectedSignals: [
        'Ensemble level (school, county, all-state) with selection context',
        'Section improvement or mentorship of section members',
        'Performance at significant events or venues',
        'Multi-year commitment with progression',
      ],
      differentiators: [
        'All-State or All-National selection with audition statistics',
        'Teaching section members who then achieved individual recognition',
        'Performing as soloist with the ensemble (concerto, featured solo)',
        'Creative contributions: arranging, selecting repertoire, leading sectional rehearsals',
        'Holding the position across multiple competitive ensembles simultaneously',
      ],
      overclaimingRisks: [
        'Claiming "concertmaster" at school level as if it were a regional distinction',
        'Overstating section leader responsibilities (it\'s a role, not a separate achievement)',
        'Implying the ensemble\'s success was primarily due to individual leadership',
      ],
      authenticPatterns: [
        'Concertmaster, county honor orchestra (selected from 150 auditions); mentored 6 violinists',
        'Drum major: led 120-member marching band to state championship; redesigned drill formations',
        'Section leader 3 years; section improved from Division III to Division I festival rating',
      ],
    },
    {
      role: 'Lead Actor / Principal Dancer',
      expectedSignals: [
        'Audition competitiveness (number who auditioned, callback process)',
        'Number of performances and audience size',
        'Production quality context (school, community theater, professional)',
        'Specific roles with production names (briefly)',
      ],
      differentiators: [
        'Cast through open auditions against non-school community members',
        'Selected for state or regional theater honors (International Thespian Society)',
        'Performing in productions with professional directors or guest artists',
        'Receiving external recognition (reviews, awards, festival selections)',
        'Sustained leading roles across multiple seasons showing consistency',
      ],
      overclaimingRisks: [
        'Presenting school musicals as equivalent to professional or regional theater',
        'Listing character names as if they communicate achievement level',
        'Claiming "principal dancer" without specifying the company or ensemble level',
        'Overstating audience sizes for school productions',
      ],
      authenticPatterns: [
        'Lead in 4 productions over 3 years; cast from 80+ auditions; 24 shows, 6,000 audience',
        'Principal dancer, regional ballet company; performed Nutcracker for 3 seasons (12 shows/yr)',
        'Selected for state thespian showcase; performed original monologue for 500 at convention',
      ],
    },
    {
      role: 'Music Director / Student Conductor / Choreographer',
      expectedSignals: [
        'Size and composition of the ensemble they led',
        'Specific productions or performances directed',
        'Preparation and rehearsal leadership responsibilities',
        'Results of their creative direction (audience response, competitions)',
      ],
      differentiators: [
        'Creating original arrangements, compositions, or choreography',
        'Managing complex multi-person rehearsal processes',
        'Productions receiving external recognition or festival selection',
        'Training or mentoring other student directors or choreographers',
        'Balancing creative vision with ensemble capabilities',
      ],
      overclaimingRisks: [
        'Claiming "music director" when the adult teacher made all creative decisions',
        'Overstating the independence of student conducting roles',
        'Presenting choreography for a school show as equivalent to professional work',
      ],
      authenticPatterns: [
        'Student music director: arranged 8 songs for 18-voice a cappella group; won regional competition',
        'Choreographed 20-minute dance piece performed by 15 dancers at state arts festival',
        'Student conductor for 3 concerts; led 40-piece orchestra in performances for 1,500',
      ],
    },
    {
      role: 'Technical Director / Stage Manager / Designer',
      expectedSignals: [
        'Number of productions worked on',
        'Budget managed and resources coordinated',
        'Crew size supervised',
        'Specific technical challenges solved',
      ],
      differentiators: [
        'Original design work (lighting design, set design, sound design)',
        'Managing significant budgets independently',
        'Problem-solving under performance pressure (show must go on scenarios)',
        'Building or constructing complex set pieces or technical systems',
        'Training incoming crew members on technical systems',
      ],
      overclaimingRisks: [
        'Claiming "technical director" when actually just a crew member',
        'Overstating budget authority (managing vs. tracking)',
        'Presenting routine tasks (running spotlight) as "lighting design"',
      ],
      authenticPatterns: [
        'Stage managed 5 productions (40+ cast/crew each); redesigned backstage workflow',
        'Designed lighting for 8 shows; built custom LED system saving $2K vs. rental',
        'Technical director: managed $12K budget, built 15 set pieces, trained crew of 12',
      ],
    },
    {
      role: 'Private Instructor / Section Coach / Ensemble Founder',
      expectedSignals: [
        'Number of students taught',
        'Student outcomes (competitions, ensemble placements)',
        'Duration and consistency of instruction',
        'Teaching methodology or curriculum developed',
      ],
      differentiators: [
        'Students achieving competitive success directly attributable to instruction',
        'Creating sustainable teaching programs that continue without the founder',
        'Teaching underserved populations who lack access to private instruction',
        'Developing teaching materials used by other instructors',
        'Founding ensembles that achieved independent competitive success',
      ],
      overclaimingRisks: [
        'Claiming student outcomes that were primarily due to other factors',
        'Overstating the formality or rigor of casual peer tutoring',
        'Presenting "helping friends" as structured private instruction',
      ],
      authenticPatterns: [
        'Private piano instructor for 10 students (2 years); 4 placed at regional competition',
        'Founded jazz combo (7 members); booked 12 community gigs and raised $3K for music dept',
        'Taught free violin lessons to 15 students at community center; 6 joined school orchestra',
      ],
    },
  ],

  jargonExceptions: [
    {
      pattern: 'All-State / All-National ensemble selection',
      whyItsTheException:
        'All-State and All-National are universally recognized designations in music ' +
        'education. AOs immediately understand their significance. These terms ARE the ' +
        'achievement — there is no simpler way to communicate this competitive distinction. ' +
        'The hierarchy (school → county → all-state → all-national) is well-known in admissions.',
      example: 'All-State Orchestra 3 consecutive years; All-National Honor Ensemble senior year',
    },
    {
      pattern: 'YoungArts finalist / Semifinalist',
      whyItsTheException:
        'The National YoungArts Foundation is the most prestigious pre-college arts recognition ' +
        'in the US. AOs at selective institutions know exactly what YoungArts means — it\'s ' +
        'the arts equivalent of Intel ISEF. Naming it IS communicating the achievement level.',
      example: 'YoungArts finalist in Classical Music (top 150 nationally of 11,000 applicants)',
    },
    {
      pattern: 'International Thespian Society troupe/honors',
      whyItsTheException:
        'The International Thespian Society is the standard honor society for theater students, ' +
        'recognized by AOs at arts programs. Specific honors within it (Thespian of the Year, ' +
        'All-Star Cast at state festival) are competitive distinctions worth naming.',
      example: 'International Thespian Society: inducted junior year; state festival All-Star Cast',
    },
    {
      pattern: 'Specific prestigious summer program names (Interlochen, Tanglewood, etc.)',
      whyItsTheException:
        'Selective summer arts programs like Interlochen, Tanglewood BUTI, Walnut Hill, ' +
        'and Aspen have well-known acceptance rates and reputations. AOs recognize these ' +
        'names and immediately calibrate the student\'s level. The program name IS the signal.',
      example: 'Interlochen Arts Camp scholarship recipient (15% acceptance); concerto competition finalist',
    },
    {
      pattern: 'NYSSMA / MTNA / Solo and Ensemble ratings at highest level',
      whyItsTheException:
        'State-level adjudicated solo festivals (NYSSMA Level 6 in NY, MTNA state/national, ' +
        'Solo and Ensemble Superior rating) are the standard benchmarks for individual ' +
        'performance level. When specified at the HIGHEST level with the rating, ' +
        'they communicate achievement concisely.',
      example: 'NYSSMA Level 6 perfect score (32/32); MTNA state piano competition 1st place',
    },
  ],
};
