/**
 * Comprehensive Extracurricular Achievement Database
 *
 * This database provides deep, calibrated knowledge of what makes activities
 * good and HOW good they are, with enough specificity to accurately assess
 * ANY activity a student presents.
 *
 * Structure:
 * 1. Competition hierarchies with exact cutoffs and participant numbers
 * 2. Tier definitions with admission impact multipliers
 * 3. Category-specific benchmarks
 * 4. Context adjustment factors
 * 5. Red flag patterns
 */

// ============================================================================
// MATH COMPETITION HIERARCHY
// ============================================================================

export const MATH_COMPETITION_HIERARCHY = {
  /**
   * AMC → AIME → USAMO/USAJMO → MOP → IMO
   * The gold standard pipeline for math excellence
   */
  amo_pipeline: {
    amc_8: {
      name: 'AMC 8',
      level: 'entry',
      participants: 280000,
      awards: {
        perfect_score: { cutoff: 25, count: 20, tier: 3, admissionImpact: 'notable' },
        distinguished_honor_roll: { cutoff: 19, percentile: 1, tier: 4, admissionImpact: 'minimal' },
        honor_roll: { cutoff: 15, percentile: 5, tier: 4, admissionImpact: 'minimal' },
      },
      notes: 'Middle school entry point. Shows early interest but minimal college impact.',
    },

    amc_10_12: {
      name: 'AMC 10/12',
      level: 'foundation',
      participants: 300000,
      awards: {
        perfect_score: {
          cutoff: 150,
          count: 20, // Annually
          tier: 2,
          admissionImpact: 'significant',
          admissionMultiplier: 3,
        },
        distinction: {
          cutoff: 132, // Top 1%
          count: 3000,
          tier: 3,
          admissionImpact: 'helpful',
        },
        honor_roll: {
          cutoff: 105, // Top 5%
          count: 15000,
          tier: 4,
          admissionImpact: 'minimal',
        },
        aime_qualification: {
          cutoff: { amc10: 94.5, amc12: 76.5 }, // Varies yearly
          count: 7000,
          tier: 3,
          admissionImpact: 'solid_signal',
          notes: 'Top 2.5% of AMC 10, top 5% of AMC 12',
        },
      },
    },

    aime: {
      name: 'American Invitational Mathematics Examination',
      level: 'advanced',
      participants: 7000,
      scoring: {
        max: 15,
        median: 4,
        usamo_typical: 10,
      },
      tiers: {
        score_12_15: { tier: 2, admissionImpact: 'strong', notes: 'Near USAMO level' },
        score_10_11: { tier: 2, admissionImpact: 'significant' },
        score_7_9: { tier: 3, admissionImpact: 'solid' },
        score_4_6: { tier: 3, admissionImpact: 'good' },
        score_1_3: { tier: 4, admissionImpact: 'shows_interest' },
      },
    },

    usajmo: {
      name: 'USA Junior Mathematical Olympiad',
      level: 'elite',
      qualifiers: 240,
      from_pool: 300000,
      qualification_rate: 0.0008, // 0.08%
      tier: 1,
      admissionImpact: 'exceptional',
      mit_acceptance_estimate: 0.40, // ~40% vs 4% baseline
      notes: 'Top 240 students from AMC 10 pipeline',
    },

    usamo: {
      name: 'USA Mathematical Olympiad',
      level: 'elite',
      qualifiers: 270,
      from_pool: 300000,
      qualification_rate: 0.0009, // 0.09%
      tier: 1,
      admissionImpact: 'exceptional',
      mit_acceptance_estimate: 0.50, // ~50% vs 4% baseline
      notes: 'Top 270 students from AMC 12 pipeline',
    },

    mop: {
      name: 'Mathematical Olympiad Program',
      level: 'national_elite',
      invitees: 60,
      from_pool: 500, // USAMO/USAJMO qualifiers
      tier: 1,
      admissionImpact: 'near_guarantee',
      mit_acceptance_estimate: 0.70,
      groups: {
        black: { description: 'Top 10 non-senior TST scorers + IMO team', count: 15 },
        blue: { description: 'Next 15 non-senior finishers', count: 15 },
        green: { description: 'Top freshmen/sophomores', count: 30 },
      },
    },

    imo: {
      name: 'International Mathematical Olympiad',
      level: 'international_elite',
      usa_team: 6,
      medals: {
        gold: { percentile: 8, tier: 1, admissionImpact: 'guaranteed', acceptance: 0.90 },
        silver: { percentile: 25, tier: 1, admissionImpact: 'near_guarantee', acceptance: 0.80 },
        bronze: { percentile: 50, tier: 1, admissionImpact: 'exceptional', acceptance: 0.70 },
      },
      notes: 'USA team member = essentially guaranteed at any school',
    },
  },

  /**
   * Other prestigious math competitions
   */
  other_competitions: {
    mathcounts: {
      name: 'MATHCOUNTS',
      level: 'middle_school',
      participants: 100000,
      levels: {
        national_champion: { tier: 2, notes: 'Very strong for age' },
        national_countdown: { count: 12, tier: 2 },
        national_qualifier: { count: 224, tier: 3 },
        state_team: { count: 200, tier: 3 },
        state_individual_top10: { tier: 3 },
        chapter_winner: { tier: 4 },
      },
    },

    putnam: {
      name: 'Putnam Mathematical Competition',
      level: 'collegiate',
      participants: 4000,
      median_score: 2,
      relevance: 'High school students cannot take, but MOP/USAMO correlates highly with Putnam success',
    },

    math_kangaroo: {
      name: 'Math Kangaroo',
      level: 'entry',
      participants: 6000000, // Global
      us_participants: 50000,
      tiers: {
        national_top_20: { tier: 4, notes: 'Good foundation' },
        state_top_3: { tier: 4 },
      },
      notes: 'Entry-level international competition; shows interest but minimal impact',
    },
  },
};

// ============================================================================
// SCIENCE OLYMPIAD HIERARCHY
// ============================================================================

export const SCIENCE_OLYMPIAD_HIERARCHY = {
  usapho: {
    name: 'USA Physics Olympiad',
    pipeline: {
      f_ma: {
        name: 'F=ma Exam',
        participants: 6000,
        qualifiers: 500,
        cutoff: '15/25 (2025)',
        tier: 3,
        admissionImpact: 'solid',
      },
      usapho: {
        name: 'USAPhO Exam',
        qualifiers: 500,
        tier: 2,
        admissionImpact: 'strong',
      },
      physics_team: {
        name: 'US Physics Team (Camp)',
        count: 20,
        tier: 1,
        admissionImpact: 'exceptional',
        notes: 'Comparable to USAMO in prestige',
      },
      ipho_team: {
        name: 'IPhO Team',
        count: 5,
        tier: 1,
        admissionImpact: 'near_guarantee',
      },
    },
  },

  usabo: {
    name: 'USA Biology Olympiad',
    pipeline: {
      open_exam: {
        participants: 12000,
        notes: 'Initial screening',
      },
      semifinalist: {
        count: 480,
        cutoff: '28/50',
        tier: 2,
        admissionImpact: 'strong',
      },
      national_finalist: {
        count: 20,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      ibo_team: {
        count: 4,
        tier: 1,
        admissionImpact: 'near_guarantee',
        notes: '2024: All 4 won Gold, USA #1 worldwide',
      },
    },
  },

  usnco: {
    name: 'US National Chemistry Olympiad',
    pipeline: {
      local_exam: {
        participants: 16000,
      },
      national_exam: {
        qualifiers: 1000,
        tier: 3,
        admissionImpact: 'solid',
      },
      high_honors: {
        count: 50,
        tier: 2,
        admissionImpact: 'strong',
      },
      honors: {
        count: 150,
        tier: 2,
        admissionImpact: 'significant',
      },
      study_camp: {
        count: 20,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      icho_team: {
        count: 4,
        tier: 1,
        admissionImpact: 'near_guarantee',
      },
    },
  },

  science_olympiad_team: {
    name: 'Science Olympiad (Team)',
    description: '23 events across STEM disciplines',
    levels: {
      national_event_medalist: { tier: 2, admissionImpact: 'strong' },
      national_team_top_10: { tier: 2, admissionImpact: 'strong' },
      national_qualifier: { tier: 2, admissionImpact: 'significant' },
      state_champion: { tier: 3, admissionImpact: 'solid' },
      state_event_medalist: { tier: 3, admissionImpact: 'good' },
      regional_winner: { tier: 4, admissionImpact: 'shows_interest' },
    },
  },
};

// ============================================================================
// COMPUTER SCIENCE COMPETITION HIERARCHY
// ============================================================================

export const CS_COMPETITION_HIERARCHY = {
  usaco: {
    name: 'USA Computing Olympiad',
    pipeline: {
      bronze: {
        description: 'Entry level',
        participants: 12000,
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      silver: {
        description: 'Intermediate',
        participants: 4000,
        tier: 3,
        admissionImpact: 'solid',
      },
      gold: {
        description: 'Advanced',
        participants: 1000,
        tier: 2,
        admissionImpact: 'strong',
        cmu_impact: 'significant_boost',
      },
      platinum: {
        description: 'Elite',
        participants: 300,
        tier: 2,
        admissionImpact: 'very_strong',
        notes: 'Top 2% of competitors',
      },
      camp_finalist: {
        count: 25,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      ioi_team: {
        count: 4,
        tier: 1,
        admissionImpact: 'near_guarantee',
      },
    },
  },

  codeforces: {
    name: 'Codeforces Rating',
    description: 'Global competitive programming platform',
    ratings: {
      legendary_grandmaster: { rating: '3000+', percentile: 99.99, tier: 1, admissionImpact: 'exceptional' },
      international_grandmaster: { rating: '2600-2999', percentile: 99.9, tier: 1, admissionImpact: 'exceptional' },
      grandmaster: { rating: '2400-2599', percentile: 99.5, tier: 1, admissionImpact: 'very_strong' },
      international_master: { rating: '2300-2399', percentile: 99, tier: 2, admissionImpact: 'strong' },
      master: { rating: '2100-2299', percentile: 97, tier: 2, admissionImpact: 'strong' },
      candidate_master: { rating: '1900-2099', percentile: 93, tier: 2, admissionImpact: 'significant' },
      expert: { rating: '1600-1899', percentile: 85, tier: 3, admissionImpact: 'solid' },
      specialist: { rating: '1400-1599', percentile: 70, tier: 4, admissionImpact: 'shows_interest' },
      pupil: { rating: '1200-1399', percentile: 55, tier: 4, admissionImpact: 'minimal' },
    },
  },

  hackathons: {
    major_events: {
      hackmit: { tier: 2, notes: 'Winner/top placement is strong' },
      treehacks: { tier: 2 },
      pennapps: { tier: 2 },
      hack_club_flagship: { tier: 3 },
    },
    evaluation: {
      winner_major: { tier: 2, admissionImpact: 'strong' },
      top_10_major: { tier: 3, admissionImpact: 'solid' },
      participant: { tier: 4, admissionImpact: 'shows_interest' },
    },
    notes: 'Impact depends heavily on what was built and its real-world usage',
  },
};

// ============================================================================
// RESEARCH COMPETITION HIERARCHY
// ============================================================================

export const RESEARCH_COMPETITION_HIERARCHY = {
  regeneron_sts: {
    name: 'Regeneron Science Talent Search',
    description: 'Most prestigious high school research competition',
    levels: {
      first_place: {
        count: 1,
        award: 250000,
        tier: 1,
        admissionImpact: 'guaranteed',
        acceptance_rate: 0.95,
      },
      top_10: {
        count: 10,
        award: '40000-250000',
        tier: 1,
        admissionImpact: 'near_guarantee',
        acceptance_rate: 0.89,
      },
      finalist: {
        count: 40,
        award: 25000,
        tier: 1,
        admissionImpact: 'exceptional',
        acceptance_rate: 0.85,
      },
      scholar: {
        count: 300,
        award: 2000,
        tier: 2,
        admissionImpact: 'strong',
        notes: 'Top 12% of entrants',
      },
      entrant: {
        count: 2500,
        tier: 3,
        admissionImpact: 'shows_serious_research',
      },
    },
  },

  regeneron_isef: {
    name: 'International Science and Engineering Fair',
    description: 'World\'s largest pre-college science competition',
    levels: {
      best_of_category: {
        count: 21,
        tier: 1,
        admissionImpact: 'near_guarantee',
        acceptance_rate: 0.85,
      },
      grand_award_first: {
        count: 21,
        award: 5000,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      grand_award_second: {
        count: 21,
        award: 2000,
        tier: 1,
        admissionImpact: 'very_strong',
      },
      grand_award_third_fourth: {
        count: 42,
        award: '1000-500',
        tier: 2,
        admissionImpact: 'strong',
      },
      finalist: {
        count: 1800,
        from_pool: 7000000,
        tier: 2,
        admissionImpact: 'significant',
        mit_stat: '8% of MIT admits are ISEF finalists',
      },
      state_fair_winner: {
        tier: 3,
        admissionImpact: 'solid',
      },
      regional_fair_winner: {
        tier: 4,
        admissionImpact: 'good',
      },
    },
  },

  rsi: {
    name: 'Research Science Institute',
    description: 'Elite 6-week MIT summer research program',
    acceptance_rate: 0.03, // 3%
    participants: 100,
    applicants: 3500,
    tier: 1,
    admissionImpact: 'exceptional',
    notes: 'Acceptance to RSI alone is a major credential. FREE program.',
  },

  publication_venues: {
    top_tier: {
      examples: ['Nature', 'Science', 'Cell'],
      tier: 1,
      admissionImpact: 'near_guarantee',
      notes: 'First-author essentially unheard of for HS (~20-30 nationwide)',
    },
    peer_reviewed: {
      examples: ['Discipline-specific journals'],
      tier: 1,
      admissionImpact: 'exceptional',
    },
    selective_student_journals: {
      examples: ['The Concord Review', 'Columbia Junior Science Journal'],
      acceptance_rate: 0.05,
      tier: 2,
      admissionImpact: 'strong',
    },
    student_journals: {
      examples: ['IJHSR', 'Curieux'],
      tier: 3,
      admissionImpact: 'solid',
    },
  },
};

// ============================================================================
// DEBATE & SPEECH HIERARCHY
// ============================================================================

export const DEBATE_SPEECH_HIERARCHY = {
  toc: {
    name: 'Tournament of Champions',
    description: 'Most prestigious high school debate tournament',
    levels: {
      champion: { count: 1, tier: 1, admissionImpact: 'exceptional' },
      finalist: { count: 2, tier: 1, admissionImpact: 'very_strong' },
      semifinalist: { count: 4, tier: 2, admissionImpact: 'strong' },
      octafinalist: { count: 8, tier: 2, admissionImpact: 'significant' },
      qualifier: {
        count: 100,
        tier: 2,
        admissionImpact: 'strong',
        notes: 'Requires earning 2 bids at major tournaments',
        northwestern_stat: '42% of admitted debaters reached semifinals at major nationals',
      },
      bid_earner: { count: 400, tier: 3, admissionImpact: 'solid' },
    },
  },

  nsda_nationals: {
    name: 'NSDA National Tournament',
    participants: 6000,
    levels: {
      champion: { tier: 1, admissionImpact: 'exceptional' },
      finalist: { tier: 2, admissionImpact: 'strong' },
      semifinalist: { tier: 2, admissionImpact: 'significant' },
      elimination_round: { tier: 3, admissionImpact: 'solid' },
      qualifier: { tier: 3, admissionImpact: 'good' },
    },
  },

  school_recruitment: {
    active_recruiters: ['Yale', 'Harvard', 'Northwestern', 'Emory'],
    notes: 'These schools have dedicated forensics admissions liaisons',
  },
};

// ============================================================================
// ARTS COMPETITION HIERARCHY
// ============================================================================

export const ARTS_COMPETITION_HIERARCHY = {
  youngarts: {
    name: 'YoungArts',
    applicants: 7000,
    levels: {
      presidential_scholar: {
        count: 20,
        tier: 1,
        admissionImpact: 'exceptional',
        notes: 'Highest arts honor for high school students',
      },
      winner: {
        count: 150,
        award: 10000,
        tier: 1,
        admissionImpact: 'very_strong',
        juilliard_stat: '3x higher acceptance',
      },
      finalist: {
        count: 450,
        award: 5000,
        tier: 2,
        admissionImpact: 'strong',
      },
      merit: {
        count: 200,
        award: 1500,
        tier: 2,
        admissionImpact: 'significant',
      },
      honorable_mention: {
        count: 200,
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    acceptance_rate: 0.10, // Any recognition
  },

  scholastic: {
    name: 'Scholastic Art & Writing Awards',
    levels: {
      american_voices_visions: {
        description: 'Top regional work',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      national_gold: {
        tier: 1,
        admissionImpact: 'very_strong',
        brown_stat: '18% vs 6% overall acceptance',
      },
      national_silver_distinction: {
        tier: 2,
        admissionImpact: 'strong',
      },
      national_silver: {
        tier: 2,
        admissionImpact: 'significant',
      },
      gold_key: {
        description: 'Regional top',
        tier: 3,
        admissionImpact: 'solid',
      },
      silver_key: {
        tier: 3,
        admissionImpact: 'good',
      },
      honorable_mention: {
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  music: {
    all_national_honor_ensemble: {
      name: 'NAfME All-National',
      applicants: 10000,
      selected: 650,
      acceptance_rate: 0.065,
      tier: 2,
      admissionImpact: 'strong',
    },
    all_state: {
      tier: 3,
      admissionImpact: 'solid',
      notes: 'Varies by state competitiveness',
    },
    all_regional: {
      tier: 3,
      admissionImpact: 'good',
    },
    pre_college_conservatory: {
      examples: ['Juilliard Pre-College', 'Curtis Young Artists'],
      tier: 1,
      admissionImpact: 'exceptional',
    },
  },
};

// ============================================================================
// ATHLETICS HIERARCHY
// ============================================================================

export const ATHLETICS_HIERARCHY = {
  recruited_athlete_impact: {
    ivy_league: {
      recruited_acceptance_rate: 0.86, // Harvard data
      overall_acceptance_rate: 0.05,
      multiplier: 17,
      academic_flexibility: {
        sat_average_lower: 104, // Points lower than non-athletes
        academic_index_floor: 176, // Minimum for Ivy athletics
      },
      composition: '15-20% of class are recruited athletes',
    },
  },

  tiers: {
    tier_1_elite: {
      examples: [
        'Olympic trials qualifier',
        'National team member',
        'D1 Power 5 recruit',
        'Professional contract',
      ],
      admissionImpact: 'recruited_athlete_advantage',
    },
    tier_1_strong: {
      examples: [
        'D1 mid-major recruit',
        'D3 elite LAC recruit (Williams, Amherst)',
        'National championship in sport',
      ],
      admissionImpact: 'significant_hook',
    },
    tier_2: {
      examples: [
        'All-State',
        'State champion',
        'D2/D3 recruit',
        'National-level club team',
      ],
      admissionImpact: 'strong',
    },
    tier_3: {
      examples: [
        'Varsity captain',
        'All-Conference',
        'Team MVP',
        'Regional club competition',
      ],
      admissionImpact: 'solid',
    },
    tier_4: {
      examples: [
        'Varsity player',
        'JV sports',
        'Club team participation',
      ],
      admissionImpact: 'shows_commitment',
    },
  },

  niche_sports_advantage: {
    description: 'Sports with fewer high school athletes but college team needs',
    examples: ['Fencing', 'Squash', 'Rowing', 'Sailing', 'Water Polo'],
    notes: 'Better odds due to smaller applicant pools',
  },
};

// ============================================================================
// LEADERSHIP & SERVICE HIERARCHY
// ============================================================================

export const LEADERSHIP_SERVICE_HIERARCHY = {
  founded_organization: {
    tier_1: {
      criteria: [
        'National or international reach',
        '1000+ people served',
        '3+ years sustained',
        '$10,000+ raised or revenue',
        'Media coverage',
        'Continued after founder leaves',
      ],
      admissionImpact: 'exceptional',
    },
    tier_2: {
      criteria: [
        'Multi-school or regional reach',
        '100-1000 people served',
        '2+ years sustained',
        '$1,000-$10,000 impact',
      ],
      admissionImpact: 'strong',
    },
    tier_3: {
      criteria: [
        'Single school or local reach',
        '10-100 people served',
        '1+ year sustained',
      ],
      admissionImpact: 'solid',
    },
    red_flags: [
      'Founded junior or senior year (looks strategic)',
      'No evidence of actual impact',
      'Organization exists only on paper',
      'Multiple "nonprofits" with vague missions',
    ],
  },

  student_government: {
    student_body_president: {
      tier: 2,
      admissionImpact: 'strong',
      what_matters: 'Quantifiable achievements, not just title',
      examples: [
        'Increased voter turnout 40% to 75%',
        'Established new programs',
        'Negotiated policy changes',
      ],
    },
    class_president: {
      tier: 3,
      admissionImpact: 'solid',
    },
    class_officer: {
      tier: 3,
      admissionImpact: 'good',
    },
    representative: {
      tier: 4,
      admissionImpact: 'shows_engagement',
    },
  },

  eagle_scout_gold_award: {
    tier: 2,
    admissionImpact: 'strong',
    notes: 'Well-recognized achievement with documented leadership',
  },

  service_hours: {
    notes: 'Quality over quantity. Impact > hours.',
    what_matters: [
      'Sustained commitment (years, not weeks)',
      'Measurable impact on specific people',
      'Leadership within service organization',
      'Connection to genuine interests',
    ],
    red_flags: [
      'Voluntourism trips presented as major service',
      'Hours-focused without impact evidence',
      'Service started junior/senior year',
      'Generic hours at multiple organizations',
    ],
  },
};

// ============================================================================
// ENTREPRENEURSHIP HIERARCHY
// ============================================================================

export const ENTREPRENEURSHIP_HIERARCHY = {
  tier_1: {
    examples: [
      'Thiel Fellowship recipient (20 under 20)',
      'Startup with $100K+ revenue',
      'App/product with 10,000+ active users',
      'Forbes 30 Under 30',
      'Venture funding received',
    ],
    admissionImpact: 'exceptional',
  },
  tier_2: {
    examples: [
      'App/product with 1,000+ users',
      'Profitable business ($1K+ revenue)',
      'DECA/FBLA nationals finalist',
      'Startup accelerator participation',
    ],
    admissionImpact: 'strong',
  },
  tier_3: {
    examples: [
      'Small online business',
      'Freelance work with paying clients',
      'Local business serving community',
      'DECA/FBLA state winner',
    ],
    admissionImpact: 'solid',
  },
  tier_4: {
    examples: [
      'Business idea without execution',
      'Failed venture (can be good if lessons learned)',
      'DECA/FBLA participation',
    ],
    admissionImpact: 'shows_initiative',
  },
};

// ============================================================================
// ROBOTICS & ENGINEERING HIERARCHY
// ============================================================================

export const ROBOTICS_HIERARCHY = {
  first_frc: {
    name: 'FIRST Robotics Competition',
    teams: 3500,
    students: 87000,
    levels: {
      world_champion: { tier: 1, admissionImpact: 'exceptional' },
      world_finalist: { tier: 2, admissionImpact: 'very_strong' },
      chairmans_award: {
        tier: 1,
        admissionImpact: 'exceptional',
        notes: 'Most prestigious FIRST award - demonstrates team impact',
        mit_notes: 'MIT particularly values this',
      },
      world_qualifier: { tier: 2, admissionImpact: 'strong' },
      regional_winner: { tier: 3, admissionImpact: 'solid' },
      regional_award: { tier: 3, admissionImpact: 'good' },
      participant: { tier: 4, admissionImpact: 'shows_interest' },
    },
  },

  vex: {
    name: 'VEX Robotics',
    teams: 17000,
    levels: {
      world_champion: { tier: 1, admissionImpact: 'very_strong' },
      world_qualifier: { tier: 2, admissionImpact: 'strong' },
      state_champion: { tier: 3, admissionImpact: 'solid' },
    },
  },

  science_bowl: {
    name: 'National Science Bowl',
    participants: 10000,
    levels: {
      national_champion: { tier: 1, admissionImpact: 'exceptional' },
      national_top_16: { tier: 2, admissionImpact: 'strong' },
      national_qualifier: { tier: 2, admissionImpact: 'significant' },
      regional_winner: { tier: 3, admissionImpact: 'solid' },
    },
  },
};

// ============================================================================
// ADMISSION IMPACT QUANTIFICATION
// ============================================================================

export const ADMISSION_IMPACT_MULTIPLIERS = {
  /**
   * How much each achievement level multiplies baseline admission chance
   * Baseline at T10: ~5%
   * These are research-based estimates from various sources
   */
  near_guarantee: {
    multiplier: 18,
    acceptance_range: [0.80, 0.95],
    description: 'IMO medal, STS finalist, recruited athlete',
  },
  exceptional: {
    multiplier: 12,
    acceptance_range: [0.50, 0.70],
    description: 'USAMO, USACO camp, ISEF finalist, RSI',
  },
  very_strong: {
    multiplier: 6,
    acceptance_range: [0.30, 0.50],
    description: 'USAPhO team, STS scholar, TOC finalist',
  },
  strong: {
    multiplier: 3,
    acceptance_range: [0.15, 0.30],
    description: 'USACO platinum, AIME high score, state champion',
  },
  significant: {
    multiplier: 2,
    acceptance_range: [0.10, 0.20],
    description: 'USACO gold, AIME qualifier, regional winner',
  },
  solid: {
    multiplier: 1.5,
    acceptance_range: [0.07, 0.12],
    description: 'USACO silver, AMC distinction, varsity captain',
  },
  good: {
    multiplier: 1.2,
    acceptance_range: [0.05, 0.08],
    description: 'Basic achievements, club leadership',
  },
  shows_interest: {
    multiplier: 1.0,
    acceptance_range: [0.04, 0.06],
    description: 'Participation without distinction',
  },
  minimal: {
    multiplier: 1.0,
    acceptance_range: [0.04, 0.05],
    description: 'Entry-level participation',
  },
};

// ============================================================================
// HOOKS AND SPECIAL FACTORS
// ============================================================================

export const HOOKS_AND_SPECIAL_FACTORS = {
  recruited_athlete: {
    acceptance_rate: 0.86, // Harvard
    multiplier: 17,
    notes: '"The entire fist on the scale" - Jeffrey Selingo',
  },
  legacy: {
    primary_legacy: {
      acceptance_multiplier: 5.7, // Harvard data
      notes: 'Parent attended',
    },
    secondary_legacy: {
      acceptance_multiplier: 2.5,
      notes: 'Grandparent, sibling',
    },
  },
  development_case: {
    deans_list_acceptance: 0.42, // Harvard
    notes: 'Major donor connection',
  },
  first_generation: {
    boost: 'Modest',
    notes: 'Varies significantly by school. Often offset by socioeconomic disadvantage in access.',
  },
  geographic_diversity: {
    underrepresented_states: [
      'West Virginia', 'Montana', 'Wyoming', 'North Dakota', 'South Dakota',
      'Idaho', 'Alaska', 'Arkansas', 'Mississippi', 'Kansas', 'Nebraska',
    ],
    boost: 'Tie-breaker level',
    notes: 'Helps at margins but not primary factor',
  },
  urm_status: {
    notes: 'Post-SFFA landscape is evolving. Socioeconomic factors increasingly considered.',
  },
};

// ============================================================================
// CONTEXT MULTIPLIERS
// ============================================================================

export const CONTEXT_MULTIPLIERS = {
  school_resources: {
    elite_prep: {
      multiplier: 0.8,
      notes: 'Higher expectations - same achievement worth less',
    },
    competitive_public: {
      multiplier: 0.9,
      notes: 'Strong resources, high expectations',
    },
    well_resourced: {
      multiplier: 1.0,
      notes: 'Baseline',
    },
    average_public: {
      multiplier: 1.2,
      notes: 'Achievements more impressive given context',
    },
    under_resourced: {
      multiplier: 1.5,
      notes: 'Significant context bonus',
    },
    rural_remote: {
      multiplier: 1.4,
      notes: 'Geographic isolation limits opportunities',
    },
  },

  family_context: {
    first_generation: {
      multiplier: 1.2,
      notes: 'Self-navigated process',
    },
    low_income: {
      multiplier: 1.3,
      notes: 'Achievements despite resource constraints',
    },
    family_responsibilities: {
      multiplier: 1.3,
      notes: 'Caregiving, work, translation',
    },
    recent_immigrant: {
      multiplier: 1.2,
      notes: 'Navigating new system',
    },
  },

  work_experience_value: {
    notes: 'Work is valued equally to traditional ECs when:',
    criteria: [
      'Sustained commitment (same job 2+ years)',
      'Progression in responsibility',
      'Financial necessity demonstrated',
      'Skills/maturity gained',
    ],
    admissions_officer_quote: '"Part-time work pulls at the blue-collar heartstrings"',
  },
};

// ============================================================================
// RED FLAG PATTERNS
// ============================================================================

export const RED_FLAG_PATTERNS = {
  authenticity_red_flags: {
    late_starting: {
      pattern: 'Activities started junior/senior year',
      severity: 'moderate',
      detection: 'Clear from timeline in activities section',
    },
    title_inflation: {
      pattern: 'Multiple "Founder/President" titles without substance',
      severity: 'high',
      detection: 'No evidence of actual leadership or impact',
    },
    implausible_hours: {
      pattern: 'Time commitments that exceed available hours',
      severity: 'high',
      detection: 'Math doesn\'t add up (e.g., 80+ hours/week claimed)',
    },
    nonprofit_mills: {
      pattern: 'Multiple "nonprofits" or organizations founded',
      severity: 'high',
      detection: 'Vague missions, no evidence of continuation',
    },
  },

  academic_red_flags: {
    rigor_avoidance: {
      pattern: 'Avoiding challenging courses when available',
      severity: 'moderate',
      detection: 'Not taking APs in intended major area',
    },
    declining_trajectory: {
      pattern: 'Grades declining without explanation',
      severity: 'moderate',
      detection: 'Transcript shows clear downward trend',
    },
    test_score_mismatch: {
      pattern: 'Large gap between GPA and test scores',
      severity: 'moderate',
      detection: 'Raises questions about grade inflation or testing',
    },
  },

  character_red_flags: {
    no_community: {
      pattern: 'All individual achievements, no collaboration',
      severity: 'moderate',
      detection: 'No evidence of working with others',
    },
    pattern_of_quitting: {
      pattern: 'Starting activities then dropping them',
      severity: 'moderate',
      detection: 'Multiple 1-year commitments',
    },
    manufactured_hardship: {
      pattern: 'Trivial challenges presented as major adversity',
      severity: 'moderate',
      detection: 'Essay topic doesn\'t match actual difficulty',
    },
  },
};

// ============================================================================
// TIER CLASSIFICATION FUNCTION
// ============================================================================

export interface ActivityInput {
  name: string;
  category: string;
  description: string;
  achievements: string[];
  recognitionLevel: 'international' | 'national' | 'state' | 'regional' | 'local' | 'school' | 'none';
  yearsInvolved: number;
  hoursPerWeek: number;
  leadershipRoles: string[];
  impactMetrics?: {
    peopleAffected?: number;
    fundsRaised?: number;
    mediaRecognition?: boolean;
  };
}

export interface TierResult {
  tier: 1 | 2 | 3 | 4;
  confidence: number;
  admissionImpact: string;
  admissionMultiplier: number;
  reasoning: string[];
  matchedBenchmarks: string[];
  improvementPath?: string;
}

/**
 * Classify an activity using the comprehensive database
 */
export function classifyActivityWithDatabase(activity: ActivityInput): TierResult {
  const reasoning: string[] = [];
  const matchedBenchmarks: string[] = [];
  let tier: 1 | 2 | 3 | 4 = 4;
  let admissionImpact = 'shows_interest';

  // Check against known competitions
  const activityLower = activity.name.toLowerCase() + ' ' + activity.description.toLowerCase();

  // Math competitions
  if (activityLower.includes('usamo') || activityLower.includes('usa mathematical olympiad')) {
    if (activity.achievements.some(a => a.toLowerCase().includes('qualifier') || a.toLowerCase().includes('qualified'))) {
      tier = 1;
      admissionImpact = 'exceptional';
      matchedBenchmarks.push('USAMO Qualifier: Top 270 nationally');
      reasoning.push('USAMO qualification is a Tier 1 achievement with exceptional admission impact');
    }
  }

  if (activityLower.includes('mop') || activityLower.includes('mathematical olympiad program')) {
    tier = 1;
    admissionImpact = 'near_guarantee';
    matchedBenchmarks.push('MOP: Top 60 math students nationally');
    reasoning.push('MOP invitation is near-guarantee level achievement');
  }

  if (activityLower.includes('imo') || activityLower.includes('international math')) {
    tier = 1;
    admissionImpact = 'near_guarantee';
    matchedBenchmarks.push('IMO Team: Top 6 in USA');
    reasoning.push('IMO participation is the highest math achievement');
  }

  if (activityLower.includes('aime')) {
    const scoreMatch = activity.achievements.join(' ').match(/(\d+)/);
    if (scoreMatch) {
      const score = parseInt(scoreMatch[1]);
      if (score >= 12) {
        tier = 2;
        admissionImpact = 'strong';
        matchedBenchmarks.push(`AIME Score ${score}: Near USAMO level`);
      } else if (score >= 7) {
        tier = 3;
        admissionImpact = 'solid';
        matchedBenchmarks.push(`AIME Score ${score}: Strong math ability`);
      }
    } else {
      tier = 3;
      admissionImpact = 'solid';
      matchedBenchmarks.push('AIME Qualifier: Top 2.5% of AMC takers');
    }
    reasoning.push('AIME qualification demonstrates strong mathematical ability');
  }

  // USACO
  if (activityLower.includes('usaco') || activityLower.includes('computing olympiad')) {
    if (activityLower.includes('platinum')) {
      tier = 2;
      admissionImpact = 'very_strong';
      matchedBenchmarks.push('USACO Platinum: Top 2% of competitors');
    } else if (activityLower.includes('gold')) {
      tier = 2;
      admissionImpact = 'strong';
      matchedBenchmarks.push('USACO Gold: Top 8% of competitors');
    } else if (activityLower.includes('silver')) {
      tier = 3;
      admissionImpact = 'solid';
      matchedBenchmarks.push('USACO Silver: Intermediate level');
    } else if (activityLower.includes('camp') || activityLower.includes('finalist')) {
      tier = 1;
      admissionImpact = 'exceptional';
      matchedBenchmarks.push('USACO Camp: Top 25 nationally');
    }
    reasoning.push('USACO achievements are highly valued for CS programs');
  }

  // Research competitions
  if (activityLower.includes('regeneron') || activityLower.includes('sts') || activityLower.includes('science talent')) {
    if (activityLower.includes('finalist') || activity.achievements.some(a => a.toLowerCase().includes('finalist'))) {
      tier = 1;
      admissionImpact = 'near_guarantee';
      matchedBenchmarks.push('Regeneron STS Finalist: Top 40 of 2500');
    } else if (activityLower.includes('scholar')) {
      tier = 2;
      admissionImpact = 'strong';
      matchedBenchmarks.push('Regeneron STS Scholar: Top 300');
    }
    reasoning.push('Regeneron STS is the most prestigious high school research competition');
  }

  if (activityLower.includes('isef') || activityLower.includes('science fair')) {
    if (activity.achievements.some(a => a.toLowerCase().includes('grand') || a.toLowerCase().includes('best of'))) {
      tier = 1;
      admissionImpact = 'near_guarantee';
      matchedBenchmarks.push('ISEF Grand Award/Best of Category');
    } else if (activity.recognitionLevel === 'international' || activityLower.includes('finalist')) {
      tier = 2;
      admissionImpact = 'significant';
      matchedBenchmarks.push('ISEF Finalist: Top 1800 globally');
    } else if (activity.recognitionLevel === 'state') {
      tier = 3;
      admissionImpact = 'solid';
      matchedBenchmarks.push('State Science Fair Winner');
    }
    reasoning.push('ISEF achievement demonstrates research capability');
  }

  // Recognition level fallback
  if (matchedBenchmarks.length === 0) {
    if (activity.recognitionLevel === 'international' || activity.recognitionLevel === 'national') {
      tier = Math.min(tier, 2) as 1 | 2 | 3 | 4;
      reasoning.push(`${activity.recognitionLevel} recognition suggests high achievement`);
    } else if (activity.recognitionLevel === 'state') {
      tier = Math.min(tier, 3) as 1 | 2 | 3 | 4;
      reasoning.push('State-level recognition is solid achievement');
    }
  }

  // Leadership bonus
  if (activity.leadershipRoles.some(r =>
    r.toLowerCase().includes('founder') ||
    r.toLowerCase().includes('president') ||
    r.toLowerCase().includes('captain')
  )) {
    if (activity.yearsInvolved >= 2 && activity.impactMetrics?.peopleAffected && activity.impactMetrics.peopleAffected >= 100) {
      tier = Math.min(tier, 2) as 1 | 2 | 3 | 4;
      reasoning.push('Sustained leadership with measurable impact');
    } else if (activity.yearsInvolved >= 2) {
      reasoning.push('Leadership role with multi-year commitment');
    }
  }

  // Get multiplier
  const impactData = ADMISSION_IMPACT_MULTIPLIERS[admissionImpact as keyof typeof ADMISSION_IMPACT_MULTIPLIERS] ||
                     ADMISSION_IMPACT_MULTIPLIERS.shows_interest;

  // Improvement path
  let improvementPath: string | undefined;
  if (tier === 3) {
    improvementPath = 'Pursue higher-level competitions or deeper achievement in this area';
  } else if (tier === 4) {
    improvementPath = 'Seek leadership roles, measurable impact, or competitive achievement';
  }

  return {
    tier,
    confidence: matchedBenchmarks.length > 0 ? 0.9 : 0.7,
    admissionImpact,
    admissionMultiplier: impactData.multiplier,
    reasoning,
    matchedBenchmarks,
    improvementPath,
  };
}

// ============================================================================
// SELECTIVE SUMMER PROGRAMS HIERARCHY
// ============================================================================

export const SUMMER_PROGRAMS_HIERARCHY = {
  /**
   * Elite summer programs that significantly boost admission chances
   * Selectivity and prestige vary widely - only the most selective matter
   */
  tier_1_elite: {
    rsi: {
      name: 'Research Science Institute (MIT)',
      acceptance_rate: 0.03, // ~3%
      participants: 80,
      applicants: 3500,
      cost: 'Free',
      duration: '6 weeks',
      tier: 1,
      admissionImpact: 'exceptional',
      mit_acceptance_estimate: 0.90, // RSI admits have ~90% MIT acceptance
      notes: 'The most prestigious pre-college STEM program. Acceptance alone is a major credential.',
    },
    tasp: {
      name: 'Telluride Association Summer Program',
      acceptance_rate: 0.03, // ~3%
      participants: 66,
      applicants: 2000,
      cost: 'Free',
      duration: '6 weeks',
      tier: 1,
      admissionImpact: 'exceptional',
      focus: 'Humanities/social sciences',
      notes: 'The RSI equivalent for humanities. Acceptance is highly valued at all top schools.',
    },
    ssp: {
      name: 'Summer Science Program',
      acceptance_rate: 0.05, // ~5%
      participants: 216,
      applicants: 4000,
      locations: ['New Mexico Tech', 'CU Boulder', 'Purdue'],
      tracks: ['Astrophysics', 'Biochemistry', 'Genomics'],
      cost: 'Need-based aid available',
      duration: '5 weeks',
      tier: 1,
      admissionImpact: 'very_strong',
      caltech_stat: 'High percentage of Caltech admits attended SSP',
    },
    mathcamp: {
      name: 'Canada/USA Mathcamp',
      acceptance_rate: 0.10,
      participants: 120,
      applicants: 1200,
      cost: 'Need-based aid',
      duration: '5 weeks',
      tier: 1,
      admissionImpact: 'very_strong',
      notes: 'Requires qualifying quiz demonstrating mathematical creativity',
    },
  },

  tier_2_highly_selective: {
    clark_scholars: {
      name: 'Clark Scholars Program (Texas Tech)',
      acceptance_rate: 0.03,
      participants: 12,
      applicants: 400,
      cost: 'Free + stipend ($750)',
      duration: '7 weeks',
      tier: 2,
      admissionImpact: 'strong',
      notes: 'Highly selective research program, strong for Texas/regional applicants',
    },
    garcia_mrsec: {
      name: 'Garcia MRSEC (Stony Brook)',
      acceptance_rate: 0.10,
      participants: 25,
      cost: 'Free + stipend',
      duration: '7 weeks',
      tier: 2,
      admissionImpact: 'strong',
      focus: 'Materials science research',
    },
    simons_summer_research: {
      name: 'Simons Summer Research Program (Stony Brook)',
      acceptance_rate: 0.08,
      participants: 30,
      cost: 'Free + stipend',
      duration: '8 weeks',
      tier: 2,
      admissionImpact: 'strong',
    },
    mostec: {
      name: 'MIT MOSTEC',
      acceptance_rate: 0.10,
      participants: 100,
      cost: 'Free',
      duration: '6 months (online + on-campus)',
      tier: 2,
      admissionImpact: 'strong',
      notes: 'For underrepresented students interested in STEM',
    },
    cosmos_uc: {
      name: 'COSMOS (UC System)',
      acceptance_rate: 0.15,
      participants: 1000,
      locations: ['UC Davis', 'UC Irvine', 'UC San Diego', 'UC Santa Cruz'],
      cost: '$4,200 (aid available)',
      duration: '4 weeks',
      tier: 2,
      admissionImpact: 'significant',
      notes: 'Strong for UC admissions',
    },
    ross_math: {
      name: 'Ross Mathematics Program (Ohio State)',
      acceptance_rate: 0.15,
      participants: 50,
      cost: '$6,000 (aid available)',
      duration: '6 weeks',
      tier: 2,
      admissionImpact: 'strong',
      notes: 'Intensive number theory program',
    },
    promys: {
      name: 'PROMYS (Boston University)',
      acceptance_rate: 0.15,
      participants: 80,
      cost: '$5,500 (aid available)',
      duration: '6 weeks',
      tier: 2,
      admissionImpact: 'strong',
      notes: 'Similar to Ross in prestige and focus',
    },
    stanford_si: {
      name: 'Stanford Summer Institutes',
      acceptance_rate: 0.12,
      cost: 'Expensive ($9,000+)',
      duration: 'Varies',
      tier: 3,
      admissionImpact: 'solid',
      warning: 'Less selective than academic competitions. Do not conflate with Stanford admission.',
    },
  },

  tier_3_solid: {
    google_cssi: {
      name: 'Google CSSI',
      acceptance_rate: 0.15,
      cost: 'Free',
      tier: 3,
      admissionImpact: 'solid',
      notes: 'For underrepresented students in CS',
    },
    kode_with_klossy: {
      name: 'Kode With Klossy',
      acceptance_rate: 0.15,
      cost: 'Free',
      tier: 3,
      admissionImpact: 'solid',
      notes: 'For young women interested in CS',
    },
    girls_who_code: {
      name: 'Girls Who Code Summer Immersion',
      tier: 3,
      admissionImpact: 'solid',
      notes: 'Good for diversity narrative',
    },
  },

  red_flags_paid_programs: {
    description: 'Programs that charge high fees without selective admissions',
    warning_signs: [
      'Acceptance rate >50%',
      'Cost >$5,000 without scholarship',
      'No alumni achievement data',
      'Heavy marketing to high school students',
      'University name but not officially affiliated',
    ],
    examples_to_avoid: [
      'Most pre-college "summer programs" at elite universities',
      'Paid "research" programs like Lumiere, Polygence (not inherently bad, but not selective)',
      'Programs that guarantee acceptance',
    ],
    notes: 'Admission officers know which programs are selective vs. pay-to-play',
  },
};

// ============================================================================
// CYBERSECURITY COMPETITIONS HIERARCHY
// ============================================================================

export const CYBERSECURITY_HIERARCHY = {
  cyberpatriot: {
    name: 'CyberPatriot (Air Force Association)',
    participants: 5000, // teams
    levels: {
      national_finalist: {
        count: 28,
        tier: 1,
        admissionImpact: 'exceptional',
        notes: 'Top teams from each division compete at nationals',
      },
      national_semifinalist: {
        tier: 2,
        admissionImpact: 'strong',
      },
      platinum_tier: {
        tier: 2,
        admissionImpact: 'significant',
      },
      gold_tier: {
        tier: 3,
        admissionImpact: 'solid',
      },
      silver_tier: {
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
    notes: 'Premier high school cybersecurity competition. Valued at CMU, Georgia Tech, Purdue.',
  },

  national_cyber_league: {
    name: 'National Cyber League (NCL)',
    levels: {
      national_champion: { tier: 1, admissionImpact: 'very_strong' },
      top_10_national: { tier: 2, admissionImpact: 'strong' },
      top_100_national: { tier: 3, admissionImpact: 'solid' },
      participant: { tier: 4, admissionImpact: 'shows_interest' },
    },
  },

  picoctf: {
    name: 'picoCTF (Carnegie Mellon)',
    description: 'Beginner-friendly CTF competition',
    levels: {
      top_100_global: { tier: 2, admissionImpact: 'strong' },
      top_500_global: { tier: 3, admissionImpact: 'solid' },
      completed: { tier: 4, admissionImpact: 'shows_interest' },
    },
    notes: 'Good entry point to cybersecurity',
  },
};

// ============================================================================
// ADDITIONAL CS/TECH COMPETITIONS
// ============================================================================

export const ADDITIONAL_CS_HIERARCHY = {
  congressional_app_challenge: {
    name: 'Congressional App Challenge',
    description: 'Official House of Representatives competition',
    participants: 10000, // Estimated across all districts
    levels: {
      national_recognition: {
        description: 'App displayed in U.S. Capitol',
        tier: 2,
        admissionImpact: 'strong',
        notes: 'Strong civic recognition - valued for government/policy interested students',
      },
      district_winner: {
        count: 435, // One per district
        tier: 2,
        admissionImpact: 'significant',
        notes: 'Winner from congressional district',
      },
      district_finalist: {
        tier: 3,
        admissionImpact: 'solid',
      },
      participant: {
        tier: 4,
        admissionImpact: 'shows_initiative',
      },
    },
  },

  acsl: {
    name: 'American Computer Science League',
    levels: {
      all_star_national_winner: { tier: 1, admissionImpact: 'very_strong' },
      all_star_finalist: { tier: 2, admissionImpact: 'strong' },
      regional_contest_winner: { tier: 3, admissionImpact: 'solid' },
      participant: { tier: 4, admissionImpact: 'shows_interest' },
    },
  },

  open_source_contributions: {
    description: 'Contributions to major open source projects',
    levels: {
      major_project_maintainer: {
        examples: ['React', 'Linux kernel', 'TensorFlow'],
        tier: 1,
        admissionImpact: 'exceptional',
        notes: 'Must have significant merged PRs',
      },
      significant_contributor: {
        criteria: '10+ merged PRs to notable projects',
        tier: 2,
        admissionImpact: 'strong',
      },
      github_1000_stars: {
        tier: 2,
        admissionImpact: 'strong',
        notes: 'Original project with significant adoption',
      },
      github_500_stars: {
        tier: 3,
        admissionImpact: 'solid',
      },
      active_contributor: {
        tier: 3,
        admissionImpact: 'solid',
      },
    },
  },

  app_users: {
    description: 'Published app/website with real users',
    levels: {
      users_10000_plus: { tier: 2, admissionImpact: 'strong' },
      users_1000_plus: { tier: 3, admissionImpact: 'solid' },
      users_100_plus: { tier: 4, admissionImpact: 'shows_initiative' },
    },
    notes: 'Must be verifiable. User numbers alone don\'t tell the whole story.',
  },
};

// ============================================================================
// JUNIOR SCIENCE AND HUMANITIES SYMPOSIUM
// ============================================================================

export const JSHS_HIERARCHY = {
  name: 'Junior Science and Humanities Symposium',
  description: 'DOD-sponsored STEM research competition',
  acceptance_rate: 0.03, // Comparable to ISEF
  structure: {
    regional_symposium: {
      participants: 'Varies by region',
      tier: 3,
      admissionImpact: 'solid',
    },
    national_symposium: {
      participants: 245,
      tier: 2,
      admissionImpact: 'strong',
    },
    national_finalist_top_5: {
      count: 5,
      scholarships: '$4,000-$12,000',
      tier: 1,
      admissionImpact: 'exceptional',
    },
    national_top_3_oral: {
      count: 3,
      scholarships: 'Up to $30,000',
      tier: 1,
      admissionImpact: 'exceptional',
    },
  },
  notes: 'Currently suspended but legacy achievements recognized. Similar prestige to ISEF regional winner.',
};

// ============================================================================
// MODEL UN HIERARCHY
// ============================================================================

export const MODEL_UN_HIERARCHY = {
  prestigious_conferences: {
    harvard_mun: {
      name: 'Harvard Model United Nations',
      participants: 3500,
      awards: {
        best_delegate: { tier: 2, admissionImpact: 'strong' },
        outstanding_delegate: { tier: 3, admissionImpact: 'solid' },
        honorable_mention: { tier: 4, admissionImpact: 'good' },
      },
    },
    yale_mun: {
      name: 'Yale Model United Nations',
      awards: {
        best_delegate: { tier: 2, admissionImpact: 'strong' },
        outstanding_delegate: { tier: 3, admissionImpact: 'solid' },
      },
    },
    naimun: {
      name: 'North American Invitational MUN (Georgetown)',
      participants: 3000,
      awards: {
        best_delegate: { tier: 2, admissionImpact: 'strong' },
        outstanding_delegate: { tier: 3, admissionImpact: 'solid' },
      },
    },
    nhsmun: {
      name: 'National High School MUN',
      participants: 5000,
      awards: {
        best_delegate: { tier: 2, admissionImpact: 'significant' },
        outstanding_delegate: { tier: 3, admissionImpact: 'solid' },
      },
    },
  },
  leadership_roles: {
    secretariat: {
      description: 'Conference leadership team',
      tier: 2,
      admissionImpact: 'strong',
      notes: 'More impressive than delegate awards',
    },
    head_delegate: {
      description: 'Lead school\'s delegation',
      tier: 3,
      admissionImpact: 'solid',
    },
  },
  notes: 'Best Delegate awards from top conferences are competitive, but MUN proliferation has diluted impact of general participation.',
};

// ============================================================================
// ECONOMICS & BUSINESS COMPETITIONS
// ============================================================================

export const ECONOMICS_BUSINESS_HIERARCHY = {
  deca: {
    name: 'DECA',
    membership: 200000,
    levels: {
      icdc_first_place: {
        description: 'International Career Development Conference winner',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      icdc_finalist: {
        count: 'Top 20 per event',
        tier: 2,
        admissionImpact: 'strong',
      },
      icdc_qualifier: {
        tier: 3,
        admissionImpact: 'solid',
      },
      state_officer: {
        tier: 2,
        admissionImpact: 'strong',
      },
      state_winner: {
        tier: 3,
        admissionImpact: 'solid',
      },
    },
  },

  fbla: {
    name: 'Future Business Leaders of America',
    membership: 250000,
    levels: {
      national_champion: { tier: 1, admissionImpact: 'exceptional' },
      national_finalist: { tier: 2, admissionImpact: 'strong' },
      state_winner: { tier: 3, admissionImpact: 'solid' },
    },
  },

  diamond_challenge: {
    name: 'Diamond Challenge (University of Delaware)',
    description: 'High school entrepreneurship competition',
    levels: {
      winner: { award: 20000, tier: 2, admissionImpact: 'strong' },
      finalist: { tier: 3, admissionImpact: 'solid' },
    },
  },

  fed_challenge: {
    name: 'Academic WorldQuest / Fed Challenge',
    description: 'Economics knowledge competitions',
    levels: {
      national_winner: { tier: 2, admissionImpact: 'strong' },
      regional_winner: { tier: 3, admissionImpact: 'solid' },
    },
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export const extracurricularDatabase = {
  MATH_COMPETITION_HIERARCHY,
  SCIENCE_OLYMPIAD_HIERARCHY,
  CS_COMPETITION_HIERARCHY,
  RESEARCH_COMPETITION_HIERARCHY,
  DEBATE_SPEECH_HIERARCHY,
  ARTS_COMPETITION_HIERARCHY,
  ATHLETICS_HIERARCHY,
  LEADERSHIP_SERVICE_HIERARCHY,
  ENTREPRENEURSHIP_HIERARCHY,
  ROBOTICS_HIERARCHY,
  SUMMER_PROGRAMS_HIERARCHY,
  CYBERSECURITY_HIERARCHY,
  ADDITIONAL_CS_HIERARCHY,
  JSHS_HIERARCHY,
  MODEL_UN_HIERARCHY,
  ECONOMICS_BUSINESS_HIERARCHY,
  ADMISSION_IMPACT_MULTIPLIERS,
  HOOKS_AND_SPECIAL_FACTORS,
  CONTEXT_MULTIPLIERS,
  RED_FLAG_PATTERNS,
  classifyActivityWithDatabase,
};
