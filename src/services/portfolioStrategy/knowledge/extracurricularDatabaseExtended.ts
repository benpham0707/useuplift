/**
 * Extended Extracurricular Database
 *
 * Comprehensive coverage of ALL extracurricular categories with deep calibration.
 * This extends the base extracurricularDatabase with:
 * - Entrepreneurship/Startups
 * - Nonprofits/Community Service
 * - Internships/Work Experience
 * - School Clubs & Student Government
 * - Performing Arts
 * - Visual/Creative Arts
 * - Writing & Journalism
 * - Athletics (expanded)
 * - Unique/Miscellaneous Activities
 */

// ============================================================================
// ENTREPRENEURSHIP & STARTUPS
// ============================================================================

export const ENTREPRENEURSHIP_STARTUP_HIERARCHY = {
  /**
   * Startup/Business achievement tiers
   * Key insight: AOs look for REAL traction, not just ideas
   */

  tier_1_exceptional: {
    thiel_fellowship: {
      name: 'Thiel Fellowship',
      selectivity: 20, // recipients per year
      acceptance_rate: 0.004, // ~5000 applicants
      grant: 100000,
      tier: 1,
      admissionImpact: 'near_guarantee',
      notes: 'Drop out of college to pursue startup - very rare for HS students',
    },
    y_combinator: {
      name: 'Y Combinator',
      acceptance_rate: 0.015,
      tier: 1,
      admissionImpact: 'exceptional',
      notes: 'Extremely rare for high school founders',
    },
    significant_funding: {
      threshold: 1000000, // $1M+
      tier: 1,
      admissionImpact: 'exceptional',
      validation: 'VC/Angel funding from reputable source',
      notes: 'Must be verifiable, not family money',
    },
    major_user_traction: {
      users: 100000, // 100K+ active users
      tier: 1,
      admissionImpact: 'exceptional',
      notes: 'Active users, not just downloads',
    },
    significant_revenue: {
      threshold: 100000, // $100K+ annual
      tier: 1,
      admissionImpact: 'exceptional',
      notes: 'Real paying customers, sustainable model',
    },
    acquisition: {
      description: 'Company acquired',
      tier: 1,
      admissionImpact: 'near_guarantee',
      notes: 'Even small acquisitions show business viability',
    },
    major_media: {
      outlets: ['Forbes 30 Under 30', 'TechCrunch', 'Wall Street Journal', 'New York Times'],
      tier: 1,
      admissionImpact: 'exceptional',
    },
  },

  tier_2_distinguished: {
    reputable_accelerator: {
      programs: [
        'Techstars',
        '500 Startups',
        'MassChallenge',
        'Plug and Play',
        'Founder Institute',
        'Startup Grind',
      ],
      tier: 2,
      admissionImpact: 'very_strong',
    },
    moderate_funding: {
      threshold_min: 100000,
      threshold_max: 1000000,
      tier: 2,
      admissionImpact: 'very_strong',
      notes: 'Angel investment or seed round',
    },
    solid_traction: {
      users_min: 10000,
      users_max: 100000,
      tier: 2,
      admissionImpact: 'very_strong',
    },
    revenue_generating: {
      threshold_min: 10000,
      threshold_max: 100000,
      tier: 2,
      admissionImpact: 'strong',
    },
    pitch_competition_winner: {
      examples: [
        'Diamond Challenge (National Winner)',
        'DECA Startup Competition',
        'Conrad Challenge',
        'MIT Launch',
      ],
      tier: 2,
      admissionImpact: 'strong',
    },
    local_media: {
      description: 'Featured in local/regional business publications',
      tier: 2,
      admissionImpact: 'strong',
    },
  },

  tier_3_notable: {
    self_funded_profitable: {
      description: 'Bootstrapped business with consistent profit',
      revenue_min: 1000,
      revenue_max: 10000,
      tier: 3,
      admissionImpact: 'solid',
    },
    early_traction: {
      users_min: 1000,
      users_max: 10000,
      tier: 3,
      admissionImpact: 'solid',
    },
    school_accelerator: {
      description: 'Selected for school/local accelerator program',
      tier: 3,
      admissionImpact: 'solid',
    },
    local_pitch_winner: {
      description: 'Won local/regional pitch competition',
      tier: 3,
      admissionImpact: 'helpful',
    },
    mentorship: {
      description: 'Mentored by established entrepreneur',
      tier: 3,
      admissionImpact: 'helpful',
    },
    freelance_business: {
      description: 'Consistent freelance clients and income',
      tier: 3,
      admissionImpact: 'solid',
    },
  },

  tier_4_participation: {
    idea_stage: {
      description: 'Business idea without execution',
      tier: 4,
      admissionImpact: 'minimal',
      notes: 'Ideas without traction show interest but not execution ability',
    },
    business_plan_entry: {
      description: 'Entered business plan competition without winning',
      tier: 4,
      admissionImpact: 'minimal',
    },
    entrepreneurship_club: {
      description: 'Member of entrepreneurship club',
      tier: 4,
      admissionImpact: 'shows_interest',
    },
    shadow_experience: {
      description: 'Shadowed or interned with entrepreneur',
      tier: 4,
      admissionImpact: 'shows_interest',
    },
  },

  red_flags: {
    fake_ceo: {
      pattern: '"CEO" with no revenue, users, or verifiable product',
      severity: 'high',
      notes: 'AOs see this constantly and are very skeptical',
    },
    family_funded: {
      pattern: 'Business funded entirely by family',
      severity: 'moderate',
      notes: 'Not inherently bad but requires evidence of independence',
    },
    dropshipping_mlm: {
      pattern: 'Dropshipping store or MLM involvement',
      severity: 'high',
      notes: 'Shows poor judgment, not entrepreneurship',
    },
    no_verifiable_metrics: {
      pattern: 'Claims without any verifiable evidence',
      severity: 'high',
      notes: 'Everything should be documentable',
    },
    solo_with_big_claims: {
      pattern: 'Single founder claiming enterprise-level achievements',
      severity: 'moderate',
      notes: 'Raises credibility questions',
    },
  },

  green_flags: {
    problem_driven: 'Started to solve real problem they personally experienced',
    customer_validation: 'Built based on customer feedback',
    technical_depth: 'Built technical product themselves',
    pivot_story: 'Can discuss failures and pivots',
    sustainable_model: 'Clear path to profitability',
    team_building: 'Successfully recruited and led a team',
  },
};

// ============================================================================
// NONPROFIT & COMMUNITY SERVICE (EXPANDED)
// ============================================================================

export const NONPROFIT_SERVICE_HIERARCHY = {
  /**
   * Community service and nonprofit achievement tiers
   * Key insight: AOs are EXPERTS at spotting performative vs authentic service
   */

  tier_1_exceptional: {
    founded_501c3_national: {
      description: 'Founded 501(c)(3) with national reach',
      impact_threshold: 10000, // beneficiaries
      tier: 1,
      admissionImpact: 'exceptional',
      requirements: [
        'Legal 501(c)(3) status',
        'Multi-state operations',
        'Verifiable impact metrics',
        'Sustainable beyond founder',
      ],
    },
    major_fundraising: {
      threshold: 100000, // $100K+ raised
      tier: 1,
      admissionImpact: 'exceptional',
      notes: 'Must be for legitimate organization with overhead transparency',
    },
    presidential_volunteer_service_gold: {
      hours: 250, // minimum
      tier: 2, // High hours alone isn't Tier 1
      admissionImpact: 'strong',
      notes: 'Hours are necessary but not sufficient for top tier',
    },
    national_service_award: {
      examples: [
        'Prudential Spirit of Community Award (National)',
        'Gloria Barron Prize for Young Heroes',
        'Diller Teen Tikkun Olam Award',
        'Jefferson Award for Public Service',
      ],
      tier: 1,
      admissionImpact: 'exceptional',
    },
    program_replication: {
      description: 'Created program adopted in multiple cities/countries',
      tier: 1,
      admissionImpact: 'exceptional',
    },
    national_media_coverage: {
      outlets: ['CNN', 'Today Show', 'Good Morning America', 'NYT'],
      tier: 1,
      admissionImpact: 'exceptional',
    },
  },

  tier_2_distinguished: {
    founded_501c3_local: {
      description: 'Founded legally registered nonprofit with local impact',
      impact_threshold: 1000, // beneficiaries
      tier: 2,
      admissionImpact: 'very_strong',
    },
    significant_fundraising: {
      threshold_min: 10000,
      threshold_max: 100000,
      tier: 2,
      admissionImpact: 'strong',
    },
    state_service_award: {
      description: 'State-level recognition for service',
      tier: 2,
      admissionImpact: 'strong',
    },
    chapter_leadership: {
      description: 'Led significant chapter of national organization',
      examples: ['Key Club President (large chapter)', 'UNICEF Club Regional Coordinator'],
      tier: 2,
      admissionImpact: 'strong',
    },
    sustainable_program: {
      description: 'Created school/community program that continues without founder',
      tier: 2,
      admissionImpact: 'strong',
    },
    partnership_with_established_org: {
      description: 'Formal partnership with major nonprofit',
      examples: ['Red Cross', 'Habitat for Humanity', 'United Way'],
      tier: 2,
      admissionImpact: 'strong',
    },
  },

  tier_3_solid: {
    club_leadership: {
      description: 'President/VP of service organization',
      hours_minimum: 200,
      tier: 3,
      admissionImpact: 'solid',
    },
    organized_major_event: {
      description: 'Organized event serving 100+ people',
      tier: 3,
      admissionImpact: 'solid',
    },
    sustained_commitment: {
      description: 'Regular volunteering for 2+ years at same organization',
      hours_minimum: 100,
      tier: 3,
      admissionImpact: 'solid',
    },
    started_school_initiative: {
      description: 'Started service initiative within school',
      tier: 3,
      admissionImpact: 'helpful',
    },
    moderate_fundraising: {
      threshold_min: 1000,
      threshold_max: 10000,
      tier: 3,
      admissionImpact: 'helpful',
    },
  },

  tier_4_participation: {
    club_member: {
      description: 'Member of service organization',
      tier: 4,
      admissionImpact: 'minimal',
    },
    occasional_volunteering: {
      hours: '50-100 total',
      tier: 4,
      admissionImpact: 'minimal',
    },
    service_trip_participant: {
      description: 'Participated in organized service trip',
      tier: 4,
      admissionImpact: 'minimal',
      notes: 'Often seen skeptically unless long-term follow-up',
    },
    one_time_events: {
      description: 'Participated in one-time service events',
      tier: 4,
      admissionImpact: 'shows_interest',
    },
  },

  red_flags: {
    voluntourism: {
      pattern: 'Short-term overseas "service" without relevant skills',
      severity: 'high',
      examples: [
        'Building houses without construction experience',
        'Teaching English for one week',
        'Orphanage visits',
      ],
      notes: 'AOs are very aware of voluntourism industry problems',
    },
    senior_year_nonprofit: {
      pattern: '501(c)(3) filed in senior year',
      severity: 'high',
      notes: 'Obvious resume-building, no time to show impact',
    },
    no_verifiable_impact: {
      pattern: 'Claims without documentation',
      severity: 'high',
    },
    president_of_one: {
      pattern: '"President" of organization with no other members',
      severity: 'high',
    },
    administrative_heavy: {
      pattern: 'Most fundraising went to "administrative costs"',
      severity: 'high',
    },
    unaddressed_local_needs: {
      pattern: 'Overseas service while ignoring local community needs',
      severity: 'moderate',
      notes: 'Why go abroad when similar needs exist locally?',
    },
  },

  green_flags: {
    personal_connection: 'Service connects to personal experience or family',
    long_term: '3+ years with same cause',
    local_focus: 'Addressing needs in own community',
    sustainable: 'Program continues without founder',
    partnership: 'Collaboration with established organizations',
    measurable: 'Clear metrics of impact',
    reciprocal: 'Values dignity of those served',
    skill_based: 'Applying real skills to help',
  },

  service_organization_rankings: {
    tier_1_national: ['AmeriCorps', 'Peace Corps (rare for HS)'],
    tier_2_distinguished: [
      'Key Club International',
      'Interact Club (Rotary)',
      'National Honor Society (service hours)',
      'Boys & Girls State',
    ],
    tier_3_solid: [
      'Local hospital volunteering',
      'Food bank regular volunteer',
      'Tutoring programs',
      'Animal shelter volunteer',
    ],
    tier_4_participation: [
      'One-time food drives',
      'Holiday volunteering',
      'School-required service',
    ],
  },
};

// ============================================================================
// INTERNSHIPS & WORK EXPERIENCE
// ============================================================================

export const INTERNSHIP_WORK_HIERARCHY = {
  /**
   * Professional experience calibration
   * CRITICAL: Context matters enormously here
   */

  stem_internships: {
    tier_1_exceptional: {
      faang: {
        companies: ['Google', 'Apple', 'Meta', 'Amazon', 'Microsoft', 'Netflix'],
        notes: 'Extremely rare for HS students - usually STEP or similar program',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      quant_finance: {
        companies: ['Jane Street', 'Citadel', 'Two Sigma', 'DE Shaw', 'Bridgewater'],
        notes: 'Nearly impossible for HS - shows exceptional quantitative ability',
        tier: 1,
        admissionImpact: 'near_guarantee',
      },
      national_labs: {
        examples: ['Los Alamos', 'Fermilab', 'Argonne', 'Oak Ridge', 'Lawrence Berkeley'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      nasa_jpl: {
        programs: ['NASA internships', 'JPL summer programs'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      nih_research: {
        programs: ['NIH Summer Internship Program', 'NIAID internship'],
        acceptance_rate: 0.05,
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      established_tech: {
        examples: ['Salesforce', 'Adobe', 'Intel', 'NVIDIA', 'Qualcomm'],
        tier: 2,
        admissionImpact: 'very_strong',
      },
      biotech_pharma: {
        examples: ['Genentech', 'Gilead', 'Amgen', 'Pfizer', 'Moderna'],
        tier: 2,
        admissionImpact: 'very_strong',
      },
      university_research: {
        description: 'Research position at university lab',
        requirements: ['Working directly with professor', 'Substantive project'],
        tier: 2,
        admissionImpact: 'strong',
      },
      well_funded_startup: {
        description: 'Engineering role at funded startup',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      local_tech: {
        description: 'Software/engineering role at local company',
        tier: 3,
        admissionImpact: 'solid',
      },
      startup_any: {
        description: 'Technical role at any startup',
        tier: 3,
        admissionImpact: 'solid',
      },
      research_assistant: {
        description: 'Lab assistant at university',
        notes: 'Less substantive than direct research role',
        tier: 3,
        admissionImpact: 'helpful',
      },
    },
    tier_4_exposure: {
      shadow_experience: {
        description: 'Job shadowing at tech company',
        tier: 4,
        admissionImpact: 'minimal',
      },
      generic_it: {
        description: 'IT support or basic tech role',
        tier: 4,
        admissionImpact: 'minimal',
      },
    },
  },

  finance_business_internships: {
    tier_1_exceptional: {
      investment_banking: {
        firms: ['Goldman Sachs', 'Morgan Stanley', 'JP Morgan', 'Bank of America'],
        notes: 'HS internships are rare - usually diversity programs',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      consulting_mbb: {
        firms: ['McKinsey', 'BCG', 'Bain'],
        notes: 'Essentially impossible for HS',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      pe_hedge_fund: {
        examples: ['Blackstone', 'KKR', 'Carlyle', 'Bridgewater'],
        notes: 'Very rare for HS',
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      big_4: {
        firms: ['Deloitte', 'PwC', 'EY', 'KPMG'],
        tier: 2,
        admissionImpact: 'strong',
      },
      regional_finance: {
        description: 'Internship at regional bank or financial firm',
        tier: 2,
        admissionImpact: 'strong',
      },
      corporate_finance: {
        description: 'Finance role at Fortune 500',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      local_firm: {
        description: 'Role at local accounting/financial planning firm',
        tier: 3,
        admissionImpact: 'solid',
      },
      startup_business: {
        description: 'Business operations at startup',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_exposure: {
      retail_banking: {
        description: 'Teller or customer service at bank',
        tier: 4,
        admissionImpact: 'minimal',
      },
      generic_office: {
        description: 'General office administration',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  law_policy_internships: {
    tier_1_exceptional: {
      congress: {
        description: 'Working for member of Congress',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      white_house: {
        description: 'White House internship',
        notes: 'Must be 18+ so rare for HS',
        tier: 1,
        admissionImpact: 'near_guarantee',
      },
      federal_judge: {
        description: 'Chambers of federal judge',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      major_think_tank: {
        examples: ['Brookings', 'AEI', 'RAND', 'Heritage', 'Cato'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      state_government: {
        description: 'State legislature or governors office',
        tier: 2,
        admissionImpact: 'strong',
      },
      major_law_firm: {
        description: 'AM Law 100 firm',
        tier: 2,
        admissionImpact: 'strong',
      },
      state_court: {
        description: 'State court judicial internship',
        tier: 2,
        admissionImpact: 'strong',
      },
      advocacy_org: {
        examples: ['ACLU', 'EFF', 'NAACP Legal Defense'],
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      local_government: {
        description: 'City or county government',
        tier: 3,
        admissionImpact: 'solid',
      },
      local_law_firm: {
        description: 'Local attorney office',
        tier: 3,
        admissionImpact: 'solid',
      },
      campaign: {
        description: 'Political campaign (beyond volunteering)',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_exposure: {
      campaign_volunteer: {
        description: 'Campaign volunteering',
        tier: 4,
        admissionImpact: 'minimal',
      },
      generic_office: {
        description: 'Filing/administrative at any office',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  healthcare_internships: {
    tier_1_exceptional: {
      clinical_research: {
        description: 'Substantive role in clinical trial',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      published_medical_research: {
        description: 'Research leading to publication',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      emt_certification: {
        description: 'EMT certification + active service',
        tier: 2, // Strong but standardized
        admissionImpact: 'strong',
      },
    },
    tier_2_distinguished: {
      hospital_research: {
        description: 'Research assistant at academic medical center',
        tier: 2,
        admissionImpact: 'strong',
      },
      medical_scribe: {
        description: 'Medical scribing with patient interaction',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      hospital_volunteer: {
        description: 'Regular hospital volunteering (100+ hours)',
        tier: 3,
        admissionImpact: 'solid',
      },
      clinic_volunteer: {
        description: 'Free clinic volunteering',
        tier: 3,
        admissionImpact: 'solid',
      },
      cna_certification: {
        description: 'CNA certification',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_exposure: {
      physician_shadowing: {
        description: 'Shadowing physicians',
        hours_minimum: 50,
        tier: 4,
        admissionImpact: 'shows_interest',
        notes: 'Necessary but not differentiating',
      },
      brief_volunteer: {
        description: 'Occasional hospital volunteering',
        tier: 4,
        admissionImpact: 'minimal',
      },
    },
  },

  work_experience_context: {
    /**
     * CRITICAL: Work experience is context-dependent
     * The same job can be Tier 2 or Tier 4 depending on circumstances
     */
    high_value_contexts: {
      financial_necessity: {
        description: 'Working to support family while maintaining academics',
        adjustment: '+1 tier',
        notes: 'Shows resilience, responsibility, time management',
      },
      first_gen_work: {
        description: 'First-gen student balancing work and school',
        adjustment: '+1 tier',
      },
      career_relevance: {
        description: 'Job directly related to intended field',
        adjustment: '+0.5 tier',
      },
      progressive_responsibility: {
        description: 'Promoted or given increasing responsibility',
        adjustment: '+0.5 tier',
      },
    },
    low_value_contexts: {
      wealthy_family: {
        description: 'Unpaid internship arranged through family connections',
        adjustment: '-0.5 tier',
        notes: 'Shows privilege, not necessarily merit',
      },
      minimal_hours: {
        description: 'Working less than 10 hours/week',
        adjustment: '-0.5 tier',
      },
      no_learning: {
        description: 'Purely mechanical work with no skill development',
        adjustment: '-0.5 tier',
      },
    },
  },
};

// ============================================================================
// SCHOOL CLUBS & STUDENT GOVERNMENT
// ============================================================================

export const SCHOOL_CLUBS_HIERARCHY = {
  /**
   * School-based activities calibration
   * Most students participate here - differentiation is key
   */

  student_government: {
    tier_1_exceptional: {
      boys_girls_state_governor: {
        description: 'Elected Governor at Boys/Girls State',
        selectivity: '1 of ~1000 attendees',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      national_student_council: {
        description: 'National Association of Student Councils officer',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      state_student_government: {
        description: 'State-level student government position',
        tier: 1,
        admissionImpact: 'very_strong',
      },
    },
    tier_2_distinguished: {
      student_body_president: {
        description: 'Student Body President (competitive school)',
        tier: 2,
        admissionImpact: 'strong',
        notes: 'More impressive at large, competitive schools',
      },
      boys_girls_state: {
        description: 'Selected for Boys/Girls State',
        acceptance_rate: 0.02, // varies by state
        tier: 2,
        admissionImpact: 'strong',
      },
      class_president_4_years: {
        description: 'Class president all 4 years',
        tier: 2,
        admissionImpact: 'strong',
      },
      major_policy_change: {
        description: 'Led significant policy change at school',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      class_president: {
        description: 'Class president (1-2 years)',
        tier: 3,
        admissionImpact: 'solid',
      },
      student_council_officer: {
        description: 'VP, Secretary, Treasurer of student council',
        tier: 3,
        admissionImpact: 'solid',
      },
      committee_chair: {
        description: 'Chair of significant committee',
        tier: 3,
        admissionImpact: 'helpful',
      },
      organized_school_event: {
        description: 'Organized major school-wide event',
        tier: 3,
        admissionImpact: 'helpful',
      },
    },
    tier_4_participation: {
      student_council_member: {
        description: 'Student council representative',
        tier: 4,
        admissionImpact: 'minimal',
      },
      homeroom_rep: {
        description: 'Homeroom or class representative',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      committee_member: {
        description: 'Member of planning committee',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  publications: {
    tier_1_exceptional: {
      national_journalism_award: {
        awards: [
          'Columbia Scholastic Press Association Gold Crown',
          'National Scholastic Press Association Pacemaker',
          'Quill & Scroll National Award',
          'JEA/NSPA Individual Awards',
        ],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      significant_external_publication: {
        description: 'Published in major external outlet',
        examples: ['New York Times student section', 'Teen Vogue', 'HuffPost'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      editor_in_chief: {
        description: 'Editor-in-Chief of newspaper/yearbook/literary magazine',
        tier: 2,
        admissionImpact: 'strong',
      },
      state_journalism_award: {
        description: 'State-level journalism award winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      built_publication: {
        description: 'Started new school publication',
        tier: 2,
        admissionImpact: 'strong',
      },
      major_investigative_piece: {
        description: 'Investigative journalism with real impact',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      section_editor: {
        description: 'Section editor (news, sports, features, etc.)',
        tier: 3,
        admissionImpact: 'solid',
      },
      regional_journalism_award: {
        description: 'Regional journalism recognition',
        tier: 3,
        admissionImpact: 'solid',
      },
      consistent_contributor: {
        description: 'Regular contributor for 3+ years',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      staff_writer: {
        description: 'Staff writer or photographer',
        tier: 4,
        admissionImpact: 'helpful',
      },
      yearbook_member: {
        description: 'Yearbook committee member',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      occasional_contributor: {
        description: 'Occasional article submission',
        tier: 4,
        admissionImpact: 'minimal',
      },
    },
  },

  academic_teams: {
    science_olympiad: {
      tier_1: {
        national_medalist: {
          description: 'Top 3 in event at National Science Olympiad',
          tier: 1,
          admissionImpact: 'exceptional',
        },
        multiple_national_events: {
          description: 'Competed in 3+ events at Nationals',
          tier: 1,
          admissionImpact: 'very_strong',
        },
      },
      tier_2: {
        national_qualifier: {
          description: 'Team qualified for Nationals',
          tier: 2,
          admissionImpact: 'strong',
        },
        state_champion_event: {
          description: 'Won event at State competition',
          tier: 2,
          admissionImpact: 'strong',
        },
      },
      tier_3: {
        state_qualifier: {
          description: 'Team qualified for State',
          tier: 3,
          admissionImpact: 'solid',
        },
        regional_winner: {
          description: 'Won event at Regional',
          tier: 3,
          admissionImpact: 'solid',
        },
      },
      tier_4: {
        team_member: {
          description: 'Team member without notable placements',
          tier: 4,
          admissionImpact: 'helpful',
        },
      },
    },

    quiz_bowl_academic_decathlon: {
      tier_1: {
        national_champion: {
          description: 'National championship team or top individual',
          tier: 1,
          admissionImpact: 'exceptional',
        },
      },
      tier_2: {
        national_qualifier: {
          description: 'Qualified for National competition',
          tier: 2,
          admissionImpact: 'strong',
        },
        state_champion: {
          description: 'State championship team',
          tier: 2,
          admissionImpact: 'strong',
        },
      },
      tier_3: {
        regional_winner: {
          description: 'Regional champion',
          tier: 3,
          admissionImpact: 'solid',
        },
        state_participant: {
          description: 'State competition participant',
          tier: 3,
          admissionImpact: 'solid',
        },
      },
      tier_4: {
        team_member: {
          description: 'Team member',
          tier: 4,
          admissionImpact: 'helpful',
        },
      },
    },

    mock_trial: {
      tier_1: {
        national_champion: {
          description: 'National championship team',
          tier: 1,
          admissionImpact: 'exceptional',
        },
        national_best_attorney: {
          description: 'Best Attorney award at Nationals',
          tier: 1,
          admissionImpact: 'exceptional',
        },
      },
      tier_2: {
        national_qualifier: {
          description: 'Qualified for National competition',
          tier: 2,
          admissionImpact: 'strong',
        },
        state_champion: {
          description: 'State championship team',
          tier: 2,
          admissionImpact: 'strong',
        },
        state_individual_award: {
          description: 'Best Attorney/Witness at State',
          tier: 2,
          admissionImpact: 'strong',
        },
      },
      tier_3: {
        regional_winner: {
          description: 'Regional winner',
          tier: 3,
          admissionImpact: 'solid',
        },
        state_participant: {
          description: 'State competition participant',
          tier: 3,
          admissionImpact: 'solid',
        },
      },
      tier_4: {
        team_member: {
          description: 'Team member',
          tier: 4,
          admissionImpact: 'helpful',
        },
      },
    },
  },

  club_founding_vs_joining: {
    /**
     * Starting vs joining clubs - important distinction
     */
    founding_value: {
      tier_boost: '+1 tier if club becomes sustainable and impactful',
      requirements: [
        'Club continues after founder leaves',
        '10+ active members',
        'School recognition/charter',
        'Meaningful activities (not just meetings)',
      ],
      red_flags: [
        'Founded senior year',
        'No other members',
        'No activities beyond meetings',
        'Name sounds impressive but no substance',
      ],
    },
    leadership_progression: {
      ideal_pattern: 'Member → Officer → President over 3+ years',
      shows: ['Growth', 'Earned leadership', 'Sustained commitment'],
    },
  },
};

// ============================================================================
// PERFORMING ARTS
// ============================================================================

export const PERFORMING_ARTS_HIERARCHY = {
  instrumental_music: {
    tier_1_exceptional: {
      national_youth_orchestra: {
        examples: ['National Youth Orchestra of the USA', 'National Youth Symphony'],
        acceptance_rate: 0.01,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      all_state_first_chair: {
        description: 'Principal/first chair at All-State',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      youngarts_finalist: {
        description: 'YoungArts Finalist in music',
        acceptance_rate: 0.05,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      major_concerto_competition: {
        description: 'Winner of major concerto competition',
        examples: ['Stulberg', 'Klein', 'Sphinx'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      pre_conservatory: {
        description: 'Accepted to pre-conservatory program',
        examples: ['Juilliard Pre-College', 'Curtis Young Artist', 'Colburn'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      all_state: {
        description: 'Selected for All-State Orchestra/Band',
        tier: 2,
        admissionImpact: 'strong',
      },
      regional_first_chair: {
        description: 'Principal at Regional Orchestra',
        tier: 2,
        admissionImpact: 'strong',
      },
      competition_winner: {
        description: 'Winner of regional/state solo competition',
        tier: 2,
        admissionImpact: 'strong',
      },
      summer_festival: {
        description: 'Accepted to competitive summer music program',
        examples: ['Tanglewood BUTI', 'Interlochen', 'Aspen'],
        tier: 2,
        admissionImpact: 'strong',
      },
      abrsm_diploma: {
        description: 'ABRSM/RCM Diploma level (DipABRSM or higher)',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      all_region: {
        description: 'Selected for All-Region Orchestra/Band',
        tier: 3,
        admissionImpact: 'solid',
      },
      school_first_chair: {
        description: 'First chair in school ensemble',
        tier: 3,
        admissionImpact: 'solid',
      },
      local_competition_placement: {
        description: 'Placed in local solo competition',
        tier: 3,
        admissionImpact: 'helpful',
      },
      abrsm_grade_8: {
        description: 'ABRSM/RCM Grade 8 with distinction',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      school_ensemble_member: {
        description: 'Member of school orchestra/band',
        tier: 4,
        admissionImpact: 'helpful',
      },
      private_lessons: {
        description: 'Taking private lessons',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  vocal_music: {
    tier_1_exceptional: {
      all_state_honors_choir: {
        description: 'All-State Honor Choir soloist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      nats_national_winner: {
        description: 'National Association of Teachers of Singing national finalist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      youngarts_voice: {
        description: 'YoungArts Voice finalist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      professional_performance: {
        description: 'Lead role in professional/semi-professional production',
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      all_state_choir: {
        description: 'Selected for All-State Choir',
        tier: 2,
        admissionImpact: 'strong',
      },
      nats_regional: {
        description: 'NATS regional competition winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      lead_musical: {
        description: 'Lead role in school musical consistently',
        tier: 2,
        admissionImpact: 'strong',
      },
      summer_vocal_program: {
        description: 'Competitive summer vocal program',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      all_region_choir: {
        description: 'All-Region Choir',
        tier: 3,
        admissionImpact: 'solid',
      },
      school_choir_section_leader: {
        description: 'Section leader in school choir',
        tier: 3,
        admissionImpact: 'solid',
      },
      supporting_roles: {
        description: 'Supporting roles in school productions',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      choir_member: {
        description: 'School choir member',
        tier: 4,
        admissionImpact: 'helpful',
      },
      voice_lessons: {
        description: 'Taking voice lessons',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  theater: {
    tier_1_exceptional: {
      international_thespian_officer: {
        description: 'International Thespian Society officer',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      professional_production: {
        description: 'Lead in professional theater production',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      youngarts_theater: {
        description: 'YoungArts Theater finalist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      original_full_production: {
        description: 'Wrote and produced original full-length play',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      national_thespian_award: {
        description: 'International Thespian Festival individual award',
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      state_thespian_award: {
        description: 'State Thespian competition winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      consistent_lead_roles: {
        description: 'Lead roles in school productions consistently',
        tier: 2,
        admissionImpact: 'strong',
      },
      regional_theater: {
        description: 'Roles in regional/community theater',
        tier: 2,
        admissionImpact: 'strong',
      },
      playwright: {
        description: 'Original play performed',
        tier: 2,
        admissionImpact: 'strong',
      },
      thespian_society_officer: {
        description: 'Troupe president/officer',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      supporting_roles: {
        description: 'Supporting roles in productions',
        tier: 3,
        admissionImpact: 'solid',
      },
      tech_lead: {
        description: 'Stage manager, lighting designer, or tech lead',
        tier: 3,
        admissionImpact: 'solid',
      },
      regional_thespian: {
        description: 'Regional Thespian competition participant',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      ensemble_member: {
        description: 'Ensemble/chorus in productions',
        tier: 4,
        admissionImpact: 'helpful',
      },
      crew_member: {
        description: 'Tech crew member',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      drama_class: {
        description: 'Taking drama classes',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  dance: {
    tier_1_exceptional: {
      pre_professional_company: {
        description: 'Member of pre-professional ballet/dance company',
        examples: ['School of American Ballet', 'Houston Ballet Academy'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      national_competition_winner: {
        description: 'National dance competition winner',
        examples: ['YAGP', 'ADC/IBC', 'USA IBC'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      youngarts_dance: {
        description: 'YoungArts Dance finalist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      summer_intensive_elite: {
        description: 'Invited to elite summer intensive',
        examples: ['American Ballet Theatre SI', 'Joffrey Summer'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      regional_competition_winner: {
        description: 'Regional competition winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      company_member: {
        description: 'Youth company member',
        tier: 2,
        admissionImpact: 'strong',
      },
      choreographer: {
        description: 'Original choreography performed',
        tier: 2,
        admissionImpact: 'strong',
      },
      summer_intensive: {
        description: 'Accepted to competitive summer intensive',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      studio_company: {
        description: 'Member of studio company',
        tier: 3,
        admissionImpact: 'solid',
      },
      competition_team: {
        description: 'Competition team member with placements',
        tier: 3,
        admissionImpact: 'solid',
      },
      solo_performances: {
        description: 'Solo performances at recitals',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      dance_class: {
        description: 'Regular dance training',
        tier: 4,
        admissionImpact: 'helpful',
      },
      school_dance_team: {
        description: 'School dance team member',
        tier: 4,
        admissionImpact: 'helpful',
      },
    },
  },
};

// ============================================================================
// VISUAL & CREATIVE ARTS
// ============================================================================

export const VISUAL_ARTS_HIERARCHY = {
  traditional_visual_arts: {
    tier_1_exceptional: {
      scholastic_gold_national: {
        description: 'Scholastic Art Awards Gold Key at National level',
        acceptance_rate: 0.01, // of all submissions
        tier: 1,
        admissionImpact: 'exceptional',
      },
      youngarts_visual: {
        description: 'YoungArts Visual Arts finalist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      major_gallery_exhibition: {
        description: 'Solo or featured exhibition at major gallery/museum',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      professional_commissions: {
        description: 'Significant professional commissions',
        threshold: 5000, // dollars
        tier: 1,
        admissionImpact: 'exceptional',
      },
      risd_pre_college_scholarship: {
        description: 'Scholarship to elite pre-college art program',
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      scholastic_gold_regional: {
        description: 'Scholastic Gold Key at Regional level',
        tier: 2,
        admissionImpact: 'strong',
      },
      local_gallery_exhibition: {
        description: 'Exhibition at local gallery',
        tier: 2,
        admissionImpact: 'strong',
      },
      ap_art_portfolio_5: {
        description: 'AP Art score of 5 with exceptional portfolio',
        tier: 2,
        admissionImpact: 'strong',
      },
      competitive_commissions: {
        description: 'Regular paid commissions',
        tier: 2,
        admissionImpact: 'strong',
      },
      art_summer_program: {
        description: 'Accepted to competitive summer art program',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      scholastic_silver: {
        description: 'Scholastic Silver Key or Honorable Mention',
        tier: 3,
        admissionImpact: 'solid',
      },
      school_art_show_winner: {
        description: 'Winner of school art show',
        tier: 3,
        admissionImpact: 'helpful',
      },
      art_club_leader: {
        description: 'Art club president/officer',
        tier: 3,
        admissionImpact: 'helpful',
      },
      occasional_commissions: {
        description: 'Some paid work',
        tier: 3,
        admissionImpact: 'helpful',
      },
    },
    tier_4_participation: {
      art_class: {
        description: 'Taking art classes',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      hobby_artist: {
        description: 'Personal art practice',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  digital_media_arts: {
    tier_1_exceptional: {
      film_festival_premiere: {
        description: 'Film premiered at major festival',
        festivals: ['Sundance', 'SXSW', 'Tribeca', 'All American High School Film Festival'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      viral_content_creator: {
        description: 'Content with 1M+ views/followers',
        tier: 1,
        admissionImpact: 'exceptional',
        notes: 'Quality and substance matter, not just views',
      },
      professional_work_credited: {
        description: 'Credited work on professional production',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      game_with_users: {
        description: 'Published game with significant users',
        threshold: 10000,
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      regional_film_award: {
        description: 'Regional film festival award',
        tier: 2,
        admissionImpact: 'strong',
      },
      established_channel: {
        description: 'YouTube/content channel with 10K+ subscribers',
        tier: 2,
        admissionImpact: 'strong',
        notes: 'Educational/creative content, not just gaming',
      },
      animation_award: {
        description: 'Animation competition winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      podcast_significant: {
        description: 'Podcast with 1000+ regular listeners',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      school_film: {
        description: 'Film shown at school festival',
        tier: 3,
        admissionImpact: 'solid',
      },
      small_audience: {
        description: 'Content with engaged small audience',
        tier: 3,
        admissionImpact: 'helpful',
      },
      tech_crew_film: {
        description: 'Technical role on student films',
        tier: 3,
        admissionImpact: 'helpful',
      },
    },
    tier_4_participation: {
      film_class: {
        description: 'Film/video production class',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      hobby_content: {
        description: 'Creating content as hobby',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  photography: {
    tier_1_exceptional: {
      national_competition: {
        description: 'National photography competition winner',
        examples: ['Scholastic Gold National', 'YoungArts'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      major_publication: {
        description: 'Photos in major publication',
        examples: ['National Geographic', 'Time', 'major newspaper'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      professional_work: {
        description: 'Professional photography work',
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      regional_competition: {
        description: 'Regional competition winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      gallery_exhibition: {
        description: 'Photography exhibited in gallery',
        tier: 2,
        admissionImpact: 'strong',
      },
      paid_work: {
        description: 'Regular paid photography work',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      school_newspaper: {
        description: 'Primary photographer for school newspaper',
        tier: 3,
        admissionImpact: 'solid',
      },
      local_recognition: {
        description: 'Local competition placement',
        tier: 3,
        admissionImpact: 'helpful',
      },
    },
    tier_4_participation: {
      photo_class: {
        description: 'Photography class',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      hobby: {
        description: 'Photography as hobby',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },
};

// ============================================================================
// WRITING & JOURNALISM
// ============================================================================

export const WRITING_JOURNALISM_HIERARCHY = {
  creative_writing: {
    tier_1_exceptional: {
      scholastic_gold_national: {
        description: 'Scholastic Writing Awards Gold Key National',
        acceptance_rate: 0.005,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      youngarts_writing: {
        description: 'YoungArts Writing finalist',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      published_book: {
        description: 'Published book (real publisher, not self-published)',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      major_literary_magazine: {
        description: 'Published in major literary magazine',
        examples: ['The New Yorker', 'Paris Review', 'Kenyon Review'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      kenyon_review_young_writers: {
        description: 'Kenyon Review Young Writers Workshop',
        acceptance_rate: 0.10,
        tier: 1,
        admissionImpact: 'exceptional',
      },
      iowa_young_writers: {
        description: 'Iowa Young Writers Studio',
        acceptance_rate: 0.15,
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      scholastic_gold_regional: {
        description: 'Scholastic Gold Key Regional',
        tier: 2,
        admissionImpact: 'strong',
      },
      literary_magazine_published: {
        description: 'Published in recognized literary magazine',
        tier: 2,
        admissionImpact: 'strong',
      },
      writing_workshop_selective: {
        description: 'Accepted to selective writing workshop',
        tier: 2,
        admissionImpact: 'strong',
      },
      school_magazine_editor: {
        description: 'Editor of school literary magazine',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      scholastic_silver: {
        description: 'Scholastic Silver Key or Honorable Mention',
        tier: 3,
        admissionImpact: 'solid',
      },
      local_competition: {
        description: 'Local/regional writing competition winner',
        tier: 3,
        admissionImpact: 'helpful',
      },
      school_magazine_contributor: {
        description: 'Regular contributor to school literary magazine',
        tier: 3,
        admissionImpact: 'helpful',
      },
    },
    tier_4_participation: {
      creative_writing_class: {
        description: 'Creative writing class',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
      personal_blog: {
        description: 'Personal writing blog',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  journalism: {
    tier_1_exceptional: {
      national_award: {
        awards: [
          'NSPA Individual Award',
          'JEA National Journalist of the Year',
          'Quill & Scroll National Award',
          'Al Neuharth Award',
        ],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      major_outlet_published: {
        description: 'Published in major news outlet',
        examples: ['New York Times', 'Washington Post', 'NPR'],
        tier: 1,
        admissionImpact: 'exceptional',
      },
      investigative_impact: {
        description: 'Investigative piece that created real-world change',
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      state_award: {
        description: 'State journalism competition winner',
        tier: 2,
        admissionImpact: 'strong',
      },
      editor_in_chief: {
        description: 'Editor-in-Chief of school newspaper',
        tier: 2,
        admissionImpact: 'strong',
      },
      youth_journalism_program: {
        description: 'Competitive journalism program participant',
        examples: ['Medill-Northwestern', 'Princeton Summer Journalism'],
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      section_editor: {
        description: 'Section editor',
        tier: 3,
        admissionImpact: 'solid',
      },
      regional_award: {
        description: 'Regional journalism recognition',
        tier: 3,
        admissionImpact: 'solid',
      },
      staff_writer_consistent: {
        description: 'Consistent contributor with bylines',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      newspaper_member: {
        description: 'Newspaper staff member',
        tier: 4,
        admissionImpact: 'helpful',
      },
      occasional_article: {
        description: 'Occasional article submission',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },
};

// ============================================================================
// UNIQUE & MISCELLANEOUS ACTIVITIES
// ============================================================================

export const UNIQUE_ACTIVITIES_HIERARCHY = {
  /**
   * Activities that don't fit neatly into categories
   * These can be VERY powerful when authentic
   */

  personal_projects: {
    tier_1_exceptional: {
      open_source_significant: {
        description: 'Major contributor to popular open source project',
        threshold: 1000, // stars on project
        tier: 1,
        admissionImpact: 'exceptional',
      },
      invention_patent: {
        description: 'Patent granted for original invention',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      book_published: {
        description: 'Non-fiction book published by real publisher',
        tier: 1,
        admissionImpact: 'exceptional',
      },
      significant_website_app: {
        description: 'Website/app with significant users solving real problem',
        threshold: 10000,
        tier: 1,
        admissionImpact: 'exceptional',
      },
    },
    tier_2_distinguished: {
      open_source_contributor: {
        description: 'Regular contributor to open source',
        tier: 2,
        admissionImpact: 'strong',
      },
      technical_blog: {
        description: 'Technical blog with significant readership',
        threshold: 1000, // monthly readers
        tier: 2,
        admissionImpact: 'strong',
      },
      useful_tool: {
        description: 'Created tool used by others',
        tier: 2,
        admissionImpact: 'strong',
      },
    },
    tier_3_solid: {
      personal_portfolio: {
        description: 'Impressive portfolio of personal projects',
        tier: 3,
        admissionImpact: 'solid',
      },
      github_active: {
        description: 'Active GitHub with multiple projects',
        tier: 3,
        admissionImpact: 'solid',
      },
    },
    tier_4_participation: {
      learning_projects: {
        description: 'Tutorial/learning projects',
        tier: 4,
        admissionImpact: 'shows_interest',
      },
    },
  },

  unusual_achievements: {
    eagle_scout: {
      description: 'Eagle Scout (only ~6% of scouts achieve)',
      tier: 2,
      admissionImpact: 'strong',
      notes: 'More impressive with notable project',
    },
    gold_award: {
      description: 'Girl Scout Gold Award (~5% achieve)',
      tier: 2,
      admissionImpact: 'strong',
    },
    pilots_license: {
      description: 'Private pilot license',
      tier: 3,
      admissionImpact: 'solid',
      notes: 'Unique, shows dedication',
    },
    language_fluency: {
      description: 'Fluency in unusual language (self-taught)',
      tier: 3,
      admissionImpact: 'solid',
    },
    published_research: {
      description: 'Non-science research published',
      tier: 2,
      admissionImpact: 'strong',
    },
    documentary_created: {
      description: 'Documentary film screened publicly',
      tier: 2,
      admissionImpact: 'strong',
    },
  },

  family_responsibilities: {
    /**
     * These are context-adjusted and can be VERY impressive
     */
    caregiver: {
      description: 'Primary caregiver for family member',
      context_boost: '+2 tiers in context',
      admissionImpact: 'exceptional (with context)',
    },
    family_business: {
      description: 'Significant role in family business',
      context_boost: '+1 tier if substantive responsibilities',
      admissionImpact: 'strong (with context)',
    },
    work_to_support_family: {
      description: 'Working to financially support family',
      context_boost: '+2 tiers',
      admissionImpact: 'exceptional (with context)',
    },
    sibling_care: {
      description: 'Regular care of younger siblings',
      context_boost: '+1 tier',
      admissionImpact: 'solid (with context)',
    },
    translator_for_family: {
      description: 'Serving as translator for non-English speaking family',
      context_boost: '+1 tier',
      admissionImpact: 'solid (with context)',
    },
  },
};

// ============================================================================
// EXPORT ALL
// ============================================================================

export const extracurricularDatabaseExtended = {
  ENTREPRENEURSHIP_STARTUP_HIERARCHY,
  NONPROFIT_SERVICE_HIERARCHY,
  INTERNSHIP_WORK_HIERARCHY,
  SCHOOL_CLUBS_HIERARCHY,
  PERFORMING_ARTS_HIERARCHY,
  VISUAL_ARTS_HIERARCHY,
  WRITING_JOURNALISM_HIERARCHY,
  UNIQUE_ACTIVITIES_HIERARCHY,
};
