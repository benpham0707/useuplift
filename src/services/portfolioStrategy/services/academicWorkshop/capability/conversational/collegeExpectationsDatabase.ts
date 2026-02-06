/**
 * College Expectations Database
 *
 * Research-backed data on what different tiers of colleges expect,
 * what admitted students typically have, and how to think about
 * academic preparation strategically.
 *
 * This enables our advisor to provide context-aware guidance that
 * helps students understand what they're aiming for.
 */

// ============================================================================
// TYPES
// ============================================================================

export interface CollegeTierProfile {
  tier: CollegeTier;
  name: string;
  examples: string[];
  acceptanceRate: { low: number; high: number };

  // What admitted students typically have
  admittedStudentProfile: {
    gpaRange: { low: number; high: number; median: number };
    apCourseRange: { low: number; high: number; typical: number };
    apScoreExpectation: string;
    rigorDescription: string;
  };

  // What this tier values
  valuedCharacteristics: string[];

  // Common misconceptions
  misconceptions: Array<{
    myth: string;
    reality: string;
  }>;

  // Strategic advice for this tier
  strategicAdvice: string[];

  // Red flags at this tier
  redFlags: string[];

  // How they view academic choices
  howTheyViewRigor: string;
  howTheyViewGrades: string;
  howTheyViewTrajectory: string;
}

export type CollegeTier = 'ivy_elite' | 'highly_selective' | 'selective' | 'competitive' | 'accessible';

export interface MajorSpecificExpectation {
  major: string;
  alternateNames: string[];

  /**
   * If this major is a specialization of a broader field.
   * e.g., "Civil Engineering" is a specializationOf "Engineering"
   * When resolved, the system merges parent + child data.
   */
  specializationOf?: string;

  /**
   * List of known sub-specializations (for parent entries only).
   * Used for suggesting specific paths within a broad field.
   */
  subcategories?: string[];

  // Course requirements by tier
  requirements: {
    minimum: string[]; // Absolute minimum for consideration
    competitive: string[]; // What strong applicants have
    exceptional: string[]; // What stands out
  };

  /**
   * For specializations: requirements that ADD TO (not replace) parent requirements.
   * Only present on child entries - merged with parent at resolution time.
   */
  additionalRequirements?: {
    competitive?: string[];
    exceptional?: string[];
  };

  // Beyond courses
  beyondCourses: string[];

  // What admissions officers look for
  admissionsOfficerPerspective: string;

  // Common mistakes
  commonMistakes: string[];

  // If student is behind
  catchUpStrategies: string[];
}

// ============================================================================
// COLLEGE TIER PROFILES
// ============================================================================

export const COLLEGE_TIERS: Record<CollegeTier, CollegeTierProfile> = {
  ivy_elite: {
    tier: 'ivy_elite',
    name: 'Ivy League / Elite (Top 10)',
    examples: ['Harvard', 'Stanford', 'MIT', 'Princeton', 'Yale', 'Columbia', 'UPenn', 'Duke', 'Caltech'],
    acceptanceRate: { low: 0.03, high: 0.08 },

    admittedStudentProfile: {
      gpaRange: { low: 3.85, high: 4.0, median: 3.95 },
      apCourseRange: { low: 8, high: 15, typical: 10 },
      apScoreExpectation:
        'Most admitted students have 4s and 5s on nearly all APs. A 3 is acceptable if explained, but multiple 3s raise questions.',
      rigorDescription:
        'Admitted students have typically taken the most rigorous course load available at their school. Not taking an available AP in your intended field is a red flag.',
    },

    valuedCharacteristics: [
      'Academic excellence with demonstrated intellectual curiosity beyond the classroom',
      'Leadership that made tangible impact, not just titles',
      'Spike of exceptional depth in a focused area',
      'Personal qualities that will contribute to campus community',
      'Genuine fit with the specific institution',
    ],

    misconceptions: [
      {
        myth: 'I need 15+ APs to be competitive',
        reality:
          "Quality matters more than quantity. Taking 8-10 APs in a focused, coherent pattern aligned with your interests is better than 15 scattered APs with mediocre grades.",
      },
      {
        myth: 'One B will ruin my chances',
        reality:
          'A B in a challenging context (taking 5 APs, family circumstances) is understood. What matters is the trajectory and overall pattern, not one grade in isolation.',
      },
      {
        myth: 'I need perfect test scores',
        reality:
          "While most admitted students have high scores, there's a range. A 1550 with exceptional ECs beats a 1600 with nothing interesting.",
      },
      {
        myth: 'The most impressive extracurriculars are the rarest ones',
        reality:
          "It's not about rarity - it's about depth and impact. Being the state's best debater is more impressive than doing five random 'interesting' activities.",
      },
    ],

    strategicAdvice: [
      'Focus on depth over breadth - develop a clear academic and extracurricular theme',
      'Take APs strategically aligned with your intended major - random APs dilute your narrative',
      'If your school offers limited APs, supplement with dual enrollment or online courses',
      'Demonstrate intellectual engagement beyond coursework - research, independent projects, competitions',
      'Build relationships with teachers who can speak to your intellectual curiosity',
    ],

    redFlags: [
      "Not taking the most rigorous courses available when capable",
      'APs that don\'t align with stated major interest',
      'Declining grades without explanation',
      'No evidence of intellectual curiosity beyond required coursework',
      'Generic activities without depth or impact',
    ],

    howTheyViewRigor:
      'Rigor is expected. The question is whether you challenged yourself to your maximum capacity given your circumstances. They will compare you to other students at your school.',

    howTheyViewGrades:
      "GPA matters but context matters more. A 3.9 at a competitive magnet school may be more impressive than a 4.0 at an easy school. They look at the transcript, not just the number.",

    howTheyViewTrajectory:
      'Upward trajectory is valued - it shows growth and maturity. A student who went from 3.5 freshman year to 4.0 junior year tells a better story than a flat 3.75.',
  },

  highly_selective: {
    tier: 'highly_selective',
    name: 'Highly Selective (Top 20-50)',
    examples: [
      'Northwestern',
      'UCLA',
      'UC Berkeley',
      'Notre Dame',
      'Vanderbilt',
      'Emory',
      'Georgetown',
      'Carnegie Mellon',
      'USC',
    ],
    acceptanceRate: { low: 0.08, high: 0.20 },

    admittedStudentProfile: {
      gpaRange: { low: 3.7, high: 4.0, median: 3.85 },
      apCourseRange: { low: 5, high: 12, typical: 7 },
      apScoreExpectation:
        'Mostly 4s and 5s. A mix of 3s, 4s, and 5s is acceptable if overall pattern is strong.',
      rigorDescription:
        'Students have taken a rigorous course load, though not necessarily the absolute maximum. Quality of performance matters as much as quantity of rigor.',
    },

    valuedCharacteristics: [
      'Strong academics with clear areas of strength',
      'Meaningful extracurricular involvement with demonstrated impact',
      'Clear fit with the specific program or institution',
      'Evidence of character and personal qualities',
      'Ability to contribute to campus community',
    ],

    misconceptions: [
      {
        myth: "I can't get in without a 'hook' (legacy, athlete, etc.)",
        reality:
          "While hooks help, thousands of 'regular' students are admitted each year based on their merits. Focus on what you can control.",
      },
      {
        myth: 'These schools are backup Ivies',
        reality:
          "These schools have distinct cultures and strengths. Treating them as backups shows through in applications and hurts your chances.",
      },
    ],

    strategicAdvice: [
      'Develop genuine interest in specific programs - know why each school, not just rankings',
      'Build a coherent narrative across academics and activities',
      'Demonstrate impact in your activities, not just participation',
      'Strong recommendations that speak to specific qualities matter significantly',
    ],

    redFlags: [
      'Application reads like you picked schools by ranking alone',
      'Activities are checkbox participation without depth',
      'Writing lacks personality or genuine reflection',
    ],

    howTheyViewRigor: 'Rigor should be appropriate to your capability and interests. Not everyone needs 10 APs, but you should challenge yourself meaningfully.',

    howTheyViewGrades: "Strong GPA expected, but there's more flexibility than Ivies. A compelling student with a 3.7 can be admitted over a boring student with a 4.0.",

    howTheyViewTrajectory: 'Trajectory matters. Improvement is valued. Sustained excellence is expected but dips can be explained.',
  },

  selective: {
    tier: 'selective',
    name: 'Selective (Top 50-100)',
    examples: ['Boston University', 'Tulane', 'Ohio State', 'Purdue', 'UMass Amherst', 'Penn State', 'University of Florida', 'UT Austin'],
    acceptanceRate: { low: 0.20, high: 0.50 },

    admittedStudentProfile: {
      gpaRange: { low: 3.4, high: 3.9, median: 3.65 },
      apCourseRange: { low: 3, high: 8, typical: 5 },
      apScoreExpectation: 'Mix of 3s, 4s, and 5s is normal. Passing all your APs is the baseline expectation.',
      rigorDescription: 'Taking some AP courses shows you can handle college work. You don\'t need to max out, but you should show capability.',
    },

    valuedCharacteristics: [
      'Solid academic foundation',
      'Some extracurricular involvement',
      'Genuine interest in the school',
      'Fit with specific programs',
    ],

    misconceptions: [
      {
        myth: 'These are easy to get into',
        reality:
          "Some flagship state schools (UT Austin, UCLA) are extremely competitive for out-of-state students. Know the actual acceptance rate for YOUR situation.",
      },
    ],

    strategicAdvice: [
      'Focus on fit with specific programs - these schools have strong departments worth targeting',
      'Demonstrate clear interest through visits, contact with departments',
      "For state schools, understand in-state vs out-of-state dynamics",
    ],

    redFlags: [
      'Treating these as \"safeties\" with low-effort applications',
      'Not meeting automatic admission thresholds where they exist',
    ],

    howTheyViewRigor: 'Some rigor expected, but balance is understood. Taking 3-5 APs in relevant areas is typical for admitted students.',

    howTheyViewGrades: 'GPA matters but there\'s a wider acceptable range. Strong performance in your areas of strength is valued.',

    howTheyViewTrajectory: 'Less emphasis on trajectory - they\'re looking at your overall record more than patterns.',
  },

  competitive: {
    tier: 'competitive',
    name: 'Competitive',
    examples: ['Most state schools', 'Regional universities', 'Many private colleges'],
    acceptanceRate: { low: 0.50, high: 0.75 },

    admittedStudentProfile: {
      gpaRange: { low: 3.0, high: 3.7, median: 3.4 },
      apCourseRange: { low: 0, high: 5, typical: 2 },
      apScoreExpectation: 'Any AP coursework is a plus. Scores are less scrutinized.',
      rigorDescription: 'Taking some challenging courses shows preparedness for college work.',
    },

    valuedCharacteristics: [
      'Academic readiness for college-level work',
      'Interest in specific programs',
      'Potential to succeed and contribute',
    ],

    misconceptions: [
      {
        myth: 'These schools are lesser',
        reality:
          "These schools offer excellent education and outcomes. Fit and what you make of the opportunity matter more than prestige.",
      },
    ],

    strategicAdvice: [
      'Focus on finding good program fit',
      'Consider honors programs within these schools for additional challenge',
      'Scholarships may be available for stronger applicants',
    ],

    redFlags: ['Not meeting basic admission requirements'],

    howTheyViewRigor: 'Any rigorous coursework is a positive signal. Not required but helpful.',

    howTheyViewGrades: 'GPA is the primary academic metric. Solid performance is expected.',

    howTheyViewTrajectory: 'Less emphasis on trajectory - overall record matters more.',
  },

  accessible: {
    tier: 'accessible',
    name: 'Accessible / Open Enrollment',
    examples: ['Community colleges', 'Some state schools', 'Open admission institutions'],
    acceptanceRate: { low: 0.75, high: 1.0 },

    admittedStudentProfile: {
      gpaRange: { low: 2.0, high: 3.5, median: 2.8 },
      apCourseRange: { low: 0, high: 3, typical: 0 },
      apScoreExpectation: 'N/A - AP coursework is not expected',
      rigorDescription: 'These schools provide access to higher education regardless of high school preparation.',
    },

    valuedCharacteristics: [
      'Willingness to learn',
      'Commitment to education',
      'Potential for growth',
    ],

    misconceptions: [
      {
        myth: 'Community college is a dead end',
        reality:
          'Many successful professionals started at community colleges. Transfer pathways to excellent universities exist and are well-established.',
      },
    ],

    strategicAdvice: [
      'Research transfer agreements with target four-year schools',
      'Take challenging courses to prepare for transfer',
      'Build relationships with advisors and professors',
    ],

    redFlags: [],

    howTheyViewRigor: 'Not a factor in admission.',

    howTheyViewGrades: 'Minimal requirements for admission.',

    howTheyViewTrajectory: 'What matters is your trajectory FROM here, not before.',
  },
};

// ============================================================================
// MAJOR-SPECIFIC EXPECTATIONS
// ============================================================================

export const MAJOR_EXPECTATIONS: MajorSpecificExpectation[] = [
  {
    major: 'Computer Science',
    alternateNames: ['CS', 'CompSci', 'Software Engineering', 'Programming'],

    requirements: {
      minimum: ['AP Calculus AB', 'Some programming experience'],
      competitive: ['AP Calculus BC', 'AP Computer Science A', 'AP Physics (any)', 'Strong math grades'],
      exceptional: [
        'AP Calculus BC',
        'AP Computer Science A',
        'AP Physics C',
        'AP Statistics',
        'Personal projects or competition wins',
      ],
    },

    beyondCourses: [
      'Personal programming projects (GitHub portfolio)',
      'Hackathon participation',
      'USACO or other programming competitions',
      'Open source contributions',
      'Self-taught languages beyond Java (Python, JavaScript, etc.)',
    ],

    admissionsOfficerPerspective:
      "We want to see evidence that you can handle the math (calculus-based) and that you genuinely enjoy programming. AP CS A alone doesn't distinguish you - personal projects that show initiative and creativity do.",

    commonMistakes: [
      'Taking AP CS Principles instead of AP CS A (Principles is not sufficient for competitive programs)',
      'Strong CS interest but weak math courses (CS is fundamentally mathematical)',
      'No evidence of coding outside class (suggests interest is superficial)',
      'Claiming CS interest but no related activities or projects',
    ],

    catchUpStrategies: [
      'If behind in math: Take Calc BC or dual enrollment calculus immediately',
      'If no CS courses available: Self-study AP CS A and take the exam independently',
      'Build projects NOW - even starting junior year, a strong GitHub portfolio helps',
      'Participate in hackathons - you can start with no experience',
    ],
  },

  {
    major: 'Pre-Med / Biology',
    alternateNames: ['Pre-Medicine', 'Medicine', 'Doctor', 'Healthcare', 'Pre-Med Biology', 'Biology Pre-Med'],

    requirements: {
      minimum: ['AP Biology', 'Strong science grades overall'],
      competitive: [
        'AP Biology',
        'AP Chemistry',
        'AP Calculus (AB or BC)',
        'Some AP Physics',
        'Research or clinical experience',
      ],
      exceptional: [
        'AP Biology',
        'AP Chemistry',
        'AP Physics C or 1+2',
        'AP Calculus BC',
        'Research with publication or presentation',
        'Sustained clinical volunteering',
      ],
    },

    beyondCourses: [
      'Hospital or clinic volunteering (sustained, not just hours)',
      'Research experience (even high school level counts)',
      'Shadowing physicians',
      'Health-related community service',
      'EMT certification (for exceptional candidates)',
    ],

    admissionsOfficerPerspective:
      'Pre-med is declared by many but completed by few. We want to see that you understand what medicine actually involves (hence shadowing/volunteering) and that you can handle the science coursework. Sustained commitment to healthcare > one-time experiences.',

    commonMistakes: [
      'All sciences but weak in other areas (med schools want well-rounded students)',
      'No clinical exposure (you should know what being a doctor actually looks like)',
      'Volunteering for hours, not impact (depth over breadth)',
      "Saying 'I want to help people' without specificity (everyone says this)",
    ],

    catchUpStrategies: [
      'Start clinical volunteering NOW - even weekly visits to a hospital add up',
      'Email professors at local universities about research opportunities',
      'If missing AP sciences, take them through community college dual enrollment',
      'Develop genuine interests outside science - med schools value humanities too',
    ],
  },

  {
    major: 'Engineering',
    alternateNames: ['General Engineering', 'Undeclared Engineering'],
    subcategories: [
      'Mechanical Engineering', 'Electrical Engineering', 'Civil Engineering',
      'Chemical Engineering', 'Aerospace Engineering', 'Computer Engineering',
      'Industrial Engineering', 'Biomedical Engineering',
    ],

    requirements: {
      minimum: ['AP Calculus (AB minimum, BC preferred)', 'Physics course', 'Strong math grades'],
      competitive: [
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Chemistry',
        'Additional STEM APs',
        'Hands-on project experience',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C (both Mechanics and E&M)',
        'AP Chemistry',
        'AP Computer Science A',
        'Robotics or engineering competition wins',
        'Significant personal projects',
      ],
    },

    beyondCourses: [
      'Robotics team (FIRST Robotics, VEX, etc.)',
      'Engineering competitions (Science Olympiad, bridge building)',
      'Personal building projects',
      'Internship or job shadowing at engineering firm',
      'CAD software proficiency (SolidWorks, AutoCAD)',
      'Maker space projects (3D printing, Arduino, CNC)',
    ],

    admissionsOfficerPerspective:
      'Engineers build things. Show us you build things. Competition robotics, personal projects, anything that demonstrates you apply technical knowledge to create solutions. Strong math is necessary but not sufficient - we want to see the application mindset.',

    commonMistakes: [
      'Strong math/science but no building/making experience',
      'Calc AB instead of BC (BC is strongly preferred for engineering)',
      'No physics beyond the minimum',
      "Saying 'I like math and science' as the reason for engineering (too generic)",
    ],

    catchUpStrategies: [
      'Join robotics team ASAP - even late joiners contribute',
      'Start a personal project NOW (3D printer, Arduino, woodworking)',
      'Take Physics C if at all possible - the calculus connection matters',
      'If behind in math, summer programs can help catch up',
    ],
  },

  // ========== ENGINEERING SUB-MAJORS ==========
  {
    major: 'Mechanical Engineering',
    alternateNames: ['MechE', 'ME', 'Mechanical'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Physics C: Mechanics', 'Strong math and science GPA'],
      competitive: [
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Chemistry',
        'AP Computer Science A',
        'CAD experience',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C (both)',
        'AP Chemistry',
        'AP Computer Science A',
        'FIRST Robotics leadership',
        'Mechanical design projects with documentation',
      ],
    },
    additionalRequirements: {
      competitive: ['Materials science interest', 'Thermodynamics exposure (through Physics)'],
      exceptional: ['Patent or design competition', 'Manufacturing experience'],
    },

    beyondCourses: [
      'FIRST Robotics team (mechanical subsystem lead ideal)',
      'CAD/CAM projects (SolidWorks, Fusion 360)',
      '3D printing and prototyping projects',
      'Automotive or machine shop experience',
      'Science Olympiad (Mousetrap Vehicle, Helicopter, etc.)',
      'Personal engineering projects with iterative design',
    ],

    admissionsOfficerPerspective:
      "Mechanical engineering is the broadest engineering discipline. We want students who can design, analyze, and build physical systems. Show us CAD proficiency, hands-on fabrication experience, and understanding of how forces and energy work in real systems. FIRST Robotics mechanical leads stand out because they've experienced the full design-build-test cycle.",

    commonMistakes: [
      'Only software/coding experience without physical building',
      'No CAD proficiency (expected at most ME programs)',
      'Skipping AP Physics C: Mechanics (the most directly relevant AP)',
      'No hands-on fabrication experience',
    ],

    catchUpStrategies: [
      'Learn SolidWorks or Fusion 360 (free student licenses available)',
      'Build something physical with documentation of your design process',
      'Join robotics focusing on mechanical subsystems',
      'Take AP Physics C: Mechanics - it IS your major in miniature',
    ],
  },

  {
    major: 'Electrical Engineering',
    alternateNames: ['EE', 'ECE', 'Electrical and Computer Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Physics C: Mechanics', 'Strong math GPA'],
      competitive: [
        'AP Calculus BC',
        'AP Physics C (both Mechanics and E&M)',
        'AP Computer Science A',
        'Circuit building experience',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C (both)',
        'AP Computer Science A',
        'Multivariable Calculus or Linear Algebra (dual enrollment)',
        'Substantial electronics projects',
        'Programming proficiency beyond Java',
      ],
    },
    additionalRequirements: {
      competitive: ['Basic circuit understanding', 'Soldering/breadboarding experience'],
      exceptional: ['PCB design experience', 'Signal processing or embedded systems projects'],
    },

    beyondCourses: [
      'Arduino/Raspberry Pi projects with real applications',
      'FIRST Robotics electrical/controls subsystem',
      'Ham radio license or electronics club',
      'PCB design and fabrication projects',
      'Embedded systems programming (C/C++)',
      'Science Olympiad (Circuit Lab, Detector Building)',
    ],

    admissionsOfficerPerspective:
      "EE requires comfort with both hardware and software. AP Physics C: E&M is the single most important AP for this major - it's literally introductory EE content. We want to see circuit projects, microcontroller work, or signal processing experience. The best applicants have built electronic systems that solve real problems.",

    commonMistakes: [
      'Not taking AP Physics C: E&M (this IS introductory EE)',
      'All software experience without hardware projects',
      'Weak calculus (EE is the most math-intensive engineering discipline)',
      'No circuit building experience',
    ],

    catchUpStrategies: [
      'Take AP Physics C: E&M - it\'s the most directly relevant course',
      'Start Arduino projects (kits are inexpensive)',
      'Learn basic circuit analysis and soldering',
      'Take AP Computer Science A for programming foundation',
    ],
  },

  {
    major: 'Civil Engineering',
    alternateNames: ['CivE', 'Structural Engineering', 'Environmental Engineering', 'Transportation Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Physics C: Mechanics', 'Strong science GPA'],
      competitive: [
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Environmental Science',
        'AP Chemistry',
        'Infrastructure or sustainability interest',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Environmental Science',
        'AP Chemistry',
        'AP Statistics',
        'Sustainability or infrastructure projects',
        'Engineering competition success',
      ],
    },
    additionalRequirements: {
      competitive: ['Environmental science awareness', 'Structural design interest'],
      exceptional: ['GIS exposure', 'Community infrastructure projects'],
    },

    beyondCourses: [
      'Bridge building competitions (Science Olympiad, ASCE)',
      'Environmental sustainability projects',
      'Habitat for Humanity or community building',
      'GIS (Geographic Information Systems) projects',
      'Urban planning or community design engagement',
      'Structural analysis of buildings (personal study)',
    ],

    admissionsOfficerPerspective:
      "Civil engineering shapes the built environment. We want students who notice infrastructure - bridges, roads, water systems, buildings. Environmental sustainability is increasingly central to civil engineering. Show us you care about how communities are built and how infrastructure serves people. Bridge competitions and community building projects are ideal demonstrations.",

    commonMistakes: [
      'No awareness of infrastructure or environmental systems',
      'Skipping AP Environmental Science (increasingly relevant to CE)',
      'Only lab/theoretical interest without community connection',
      'Not understanding the public service dimension of civil engineering',
    ],

    catchUpStrategies: [
      'Enter bridge building competitions',
      'Take AP Environmental Science alongside physics and calc',
      'Volunteer with Habitat for Humanity or community development',
      'Study how infrastructure systems (water, transportation, energy) work in your community',
    ],
  },

  {
    major: 'Chemical Engineering',
    alternateNames: ['ChemE', 'ChE', 'Chemical and Biomolecular Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Chemistry', 'AP Physics', 'Strong science GPA'],
      competitive: [
        'AP Calculus BC',
        'AP Chemistry',
        'AP Physics C: Mechanics',
        'AP Biology',
        'Lab research experience',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Chemistry',
        'AP Physics C (both)',
        'AP Biology',
        'AP Statistics',
        'Chemistry research experience',
        'Process design or materials projects',
      ],
    },
    additionalRequirements: {
      competitive: ['Strong lab skills', 'Process thinking (input → transformation → output)'],
      exceptional: ['Research publication or presentation', 'Industry exposure (pharmaceutical, materials, energy)'],
    },

    beyondCourses: [
      'Chemistry research in university lab',
      'Science Olympiad chemistry events',
      'Process design or optimization projects',
      'Pharmaceutical or materials science interest',
      'Environmental remediation projects',
      'Food science or biotechnology exploration',
    ],

    admissionsOfficerPerspective:
      "Chemical engineering is where chemistry meets engineering at industrial scale. We need students strong in BOTH chemistry AND math/physics - weakness in either is a red flag. Research experience in chemistry labs shows you can handle the experimental side. The best applicants understand that ChemE is about processes and systems, not just reactions.",

    commonMistakes: [
      'Strong chemistry but weak physics (ChemE needs both equally)',
      'No lab research experience',
      'Not understanding how ChemE differs from chemistry (it\'s about scaling processes)',
      'Avoiding AP Physics C (thermodynamics is core to ChemE)',
    ],

    catchUpStrategies: [
      'Ensure both AP Chemistry AND AP Physics C are on your transcript',
      'Seek chemistry research opportunities at universities',
      'Learn about industrial processes (pharmaceuticals, energy, materials)',
      'Take AP Biology for biochemical engineering applications',
    ],
  },

  {
    major: 'Aerospace Engineering',
    alternateNames: ['AeroE', 'Astronautical Engineering', 'Aeronautics', 'Space Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Physics C: Mechanics', 'Strong math GPA'],
      competitive: [
        'AP Calculus BC',
        'AP Physics C (both)',
        'AP Chemistry',
        'AP Computer Science A',
        'Aviation or space-related projects',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C (both)',
        'AP Chemistry',
        'AP Computer Science A',
        'Multivariable Calculus (dual enrollment)',
        'Rocketry competition or aerospace project',
        'Pilot license or aviation experience',
      ],
    },
    additionalRequirements: {
      competitive: ['Fluid dynamics awareness', 'Aerospace project (model rockets, drones)'],
      exceptional: ['TARC or student rocketry competition', 'Private pilot ground school or license'],
    },

    beyondCourses: [
      'Team America Rocketry Challenge (TARC)',
      'Model rocketry with documented flight analysis',
      'Drone building and autonomous flight programming',
      'Civil Air Patrol or Young Eagles',
      'Space-related research or NASA programs',
      'Flight simulator proficiency and aerodynamics study',
    ],

    admissionsOfficerPerspective:
      "Aerospace is one of the most competitive engineering specializations. Physics C (both) is near-essential - fluid dynamics and E&M are core to aerospace. We want to see passion for flight and space demonstrated through rocketry competitions, drone projects, or aviation engagement. The TARC competition is particularly valued. Strong math through multivariable calculus shows readiness for the heavy theory load.",

    commonMistakes: [
      'Passion for space but weak physics and math',
      'Not taking AP Physics C: E&M (satellites, communications, avionics need it)',
      'No aerospace-related projects or competitions',
      'Only interested in the "cool factor" without understanding the engineering rigor',
    ],

    catchUpStrategies: [
      'Join or start a rocketry club and enter TARC',
      'Take both AP Physics C courses',
      'Build and program a drone from scratch',
      'Pursue dual enrollment in multivariable calculus',
      'Explore NASA\'s student programs and opportunities',
    ],
  },

  {
    major: 'Computer Engineering',
    alternateNames: ['CompE', 'CE', 'Computer Hardware Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Physics C: Mechanics', 'AP Computer Science A'],
      competitive: [
        'AP Calculus BC',
        'AP Physics C (both)',
        'AP Computer Science A',
        'Hardware and software projects',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C (both)',
        'AP Computer Science A',
        'Embedded systems projects',
        'Low-level programming (C/C++, Assembly)',
        'Digital logic or FPGA projects',
      ],
    },
    additionalRequirements: {
      competitive: ['Both hardware and software experience', 'Microcontroller projects'],
      exceptional: ['FPGA or digital logic design', 'Operating systems or compiler exposure'],
    },

    beyondCourses: [
      'Arduino/Raspberry Pi projects bridging hardware and software',
      'FIRST Robotics programming or electrical subsystem',
      'FPGA or digital logic projects',
      'Embedded C/C++ programming',
      'IoT (Internet of Things) projects',
      'Computer architecture self-study',
    ],

    admissionsOfficerPerspective:
      "Computer Engineering lives at the hardware-software interface. We want students comfortable in BOTH worlds - writing code AND building circuits. If you only code, you're a CS major. If you only build hardware, you're an EE major. CompE students bridge the gap. Show us embedded systems projects, microcontroller work, or IoT systems where you handled both the hardware and software sides.",

    commonMistakes: [
      'Only software experience (that\'s CS, not CompE)',
      'Only hardware experience (that\'s EE, not CompE)',
      'Not taking both AP Physics C and AP CS A',
      'No embedded systems or microcontroller experience',
    ],

    catchUpStrategies: [
      'Build an Arduino or Raspberry Pi project that combines hardware and software',
      'Take both AP Physics C: E&M and AP Computer Science A',
      'Learn C/C++ for embedded programming',
      'Study basic digital logic and computer architecture',
    ],
  },

  {
    major: 'Industrial Engineering',
    alternateNames: ['IE', 'ISE', 'Systems Engineering', 'Operations Research', 'Industrial and Systems Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Statistics', 'Strong quantitative skills'],
      competitive: [
        'AP Calculus BC',
        'AP Statistics',
        'AP Physics C: Mechanics',
        'AP Computer Science A',
        'Process improvement or optimization projects',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Statistics',
        'AP Physics C: Mechanics',
        'AP Computer Science A',
        'AP Microeconomics',
        'Data analysis or optimization projects',
        'Leadership in process improvement',
      ],
    },
    additionalRequirements: {
      competitive: ['Systems thinking', 'Data analysis skills'],
      exceptional: ['Operations research exposure', 'Supply chain or logistics projects'],
    },

    beyondCourses: [
      'Process improvement projects (school, community, workplace)',
      'Data analysis using Python, R, or Excel',
      'Supply chain or logistics volunteering',
      'DECA or FBLA business competitions',
      'Lean/Six Sigma concepts study',
      'Efficiency optimization projects',
    ],

    admissionsOfficerPerspective:
      "Industrial engineering optimizes systems involving people, processes, and technology. It's the most interdisciplinary engineering major. We want students who see inefficiency and want to fix it. AP Statistics is uniquely important for IE - it's used daily in quality control and operations research. Business competition experience (DECA, FBLA) plus engineering aptitude is a compelling combination.",

    commonMistakes: [
      'Not taking AP Statistics (it\'s more important than physics for IE)',
      'No systems thinking or process optimization evidence',
      'Confusing IE with IT or information systems',
      'Only pure STEM focus without business/operations interest',
    ],

    catchUpStrategies: [
      'Take AP Statistics - it\'s the most important AP for IE',
      'Find a process to improve at school or a job and document the results',
      'Participate in DECA or FBLA for business operations exposure',
      'Learn basic data analysis with Excel or Python',
    ],
  },

  {
    major: 'Biomedical Engineering',
    alternateNames: ['BME', 'BioE', 'Bioengineering', 'Biomedical Systems Engineering'],
    specializationOf: 'Engineering',

    requirements: {
      minimum: ['AP Calculus BC', 'AP Biology', 'AP Chemistry', 'Strong math and science foundation'],
      competitive: [
        'AP Calculus BC',
        'AP Biology',
        'AP Chemistry',
        'AP Physics C: Mechanics',
        'Research or project experience in biomedical area',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Biology',
        'AP Chemistry',
        'AP Physics C: Mechanics',
        'AP Statistics',
        'Biomedical research experience',
        'Lab skills or medical device prototyping',
      ],
    },
    additionalRequirements: {
      competitive: ['Biology AND Chemistry (not just one)', 'Interdisciplinary project work'],
      exceptional: ['Research at a university biomedical lab', 'Medical device or prosthetics project'],
    },

    beyondCourses: [
      'Research at university biomedical or bio-engineering labs',
      'Science Olympiad (especially biomedical events)',
      'Medical device design or 3D printing prosthetics projects',
      'Hospital volunteering or clinical shadowing',
      'Tissue engineering or bioinformatics self-study',
      'HOSA (Health Occupations Students of America)',
    ],

    admissionsOfficerPerspective:
      "Biomedical engineering is the most interdisciplinary engineering field - it demands BOTH deep engineering fundamentals AND strong biological sciences. We need students who can bridge the gap between the clinic and the lab. Taking AP Biology AND AP Chemistry AND AP Physics is non-negotiable for top programs. If you skip any of the three core sciences, you're not ready for BME. The students who stand out have hands-on biomedical projects - prosthetics, biosensors, medical imaging analysis - not just coursework.",

    commonMistakes: [
      'Skipping AP Chemistry (organic chemistry is a core BME requirement in college)',
      'Only focusing on biology without physics/engineering fundamentals',
      'No hands-on engineering or prototyping experience',
      'Confusing pre-med with biomedical engineering (BME is an engineering degree)',
      'Not taking AP Statistics (critical for clinical trials and biostatistics)',
    ],

    catchUpStrategies: [
      'Take AP Biology AND AP Chemistry - both are essential for BME',
      'Add AP Physics C for the engineering fundamentals',
      'Find a biomedical research lab at a local university for summer work',
      'Start a 3D printing project with biomedical applications',
      'Join Science Olympiad or HOSA for relevant competition experience',
    ],
  },

  {
    major: 'Business / Economics',
    alternateNames: ['Econ', 'Management', 'Business Administration', 'Commerce'],
    subcategories: [
      'Finance', 'Marketing', 'Accounting', 'Management',
      'Entrepreneurship', 'Supply Chain Management',
    ],

    requirements: {
      minimum: ['AP Calculus AB or AP Statistics', 'Strong overall grades'],
      competitive: [
        'AP Calculus (AB or BC)',
        'AP Statistics',
        'AP Economics (Micro and/or Macro)',
        'Strong writing (evidenced by AP English scores)',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Statistics',
        'Both AP Economics',
        'AP English Language',
        'Business competition wins or entrepreneurial experience',
      ],
    },

    beyondCourses: [
      'DECA, FBLA, or similar business competitions',
      'Investment club or stock market competitions',
      'Small business or entrepreneurial project',
      'Internship at a business',
      'Economics or business-related research',
    ],

    admissionsOfficerPerspective:
      'Business schools (especially top ones) want quantitative skills AND leadership/communication. The kid who started a small business, ran a successful club, or demonstrated real-world business thinking stands out from the kid who just took the right classes.',

    commonMistakes: [
      "Thinking business doesn't require math (it does, especially finance/econ)",
      'No leadership experience (business is about working with and leading people)',
      'Weak writing skills (business communication is critical)',
    ],

    catchUpStrategies: [
      'Start a small venture - even a small online business shows initiative',
      'Join DECA or similar and compete seriously',
      'Take both Micro and Macro economics if possible',
      'Develop public speaking skills through debate or similar',
    ],
  },

  {
    major: 'Finance',
    alternateNames: ['Financial Engineering', 'Quantitative Finance', 'Financial Mathematics', 'FinTech'],
    specializationOf: 'Business / Economics',

    requirements: {
      minimum: ['AP Calculus AB', 'AP Microeconomics or AP Macroeconomics', 'Strong quantitative skills'],
      competitive: [
        'AP Calculus BC',
        'AP Statistics',
        'Both AP Economics (Micro and Macro)',
        'AP Computer Science A',
        'Investment club or financial literacy experience',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Statistics',
        'Both AP Economics',
        'AP Computer Science A',
        'CFA or financial modeling self-study',
        'Investment competition wins',
        'Bloomberg or financial data analysis',
      ],
    },
    additionalRequirements: {
      competitive: ['Strong quantitative reasoning beyond basic calculus', 'Financial literacy evidence'],
      exceptional: ['Financial modeling or portfolio analysis projects', 'Python/R for quantitative analysis'],
    },

    beyondCourses: [
      'Investment club participation and leadership',
      'Stock market simulation competitions',
      'Financial modeling using Excel or Python',
      'Bloomberg Market Concepts certification',
      'DECA Finance events',
      'Personal investment portfolio (paper trading)',
    ],

    admissionsOfficerPerspective:
      "Finance is one of the most quantitatively demanding business majors. Top finance programs (Wharton, Stern, Ross) want students who can handle calculus-based financial modeling, statistics, and increasingly, programming. AP Calculus BC and AP Statistics are table stakes - we also want to see genuine interest in markets and economics. The student who runs an investment club AND can code has an edge over the student who just took the right classes.",

    commonMistakes: [
      'Thinking finance is just about money - it requires serious math',
      'Not taking AP Calculus BC (finance uses calculus daily)',
      'Skipping AP Statistics (risk analysis and probability are core skills)',
      'No evidence of genuine interest in markets or economics',
      'Avoiding computer science (fintech is the future of finance)',
    ],

    catchUpStrategies: [
      'Take AP Calculus BC - not AB - finance requires multi-variable calculus in college',
      'Start an investment club or join stock market competitions',
      'Learn financial modeling in Excel (DCF models, portfolio theory)',
      'Take both AP Micro and Macro economics',
      'Read financial news daily and develop market awareness',
    ],
  },

  {
    major: 'Marketing',
    alternateNames: ['Digital Marketing', 'Marketing Analytics', 'Brand Management', 'Advertising'],
    specializationOf: 'Business / Economics',

    requirements: {
      minimum: ['AP Statistics or AP Calculus AB', 'AP English Language', 'Strong communication skills'],
      competitive: [
        'AP Statistics',
        'AP Calculus AB',
        'AP English Language',
        'AP Psychology',
        'AP Microeconomics',
        'Digital marketing or social media management experience',
      ],
      exceptional: [
        'AP Statistics',
        'AP Calculus AB or BC',
        'AP English Language',
        'AP Psychology',
        'Both AP Economics',
        'AP Computer Science Principles',
        'Successful marketing campaign or brand building experience',
      ],
    },
    additionalRequirements: {
      competitive: ['Data-driven analysis skills', 'Content creation or social media portfolio'],
      exceptional: ['Marketing analytics tools experience (Google Analytics, etc.)', 'Brand strategy or campaign management'],
    },

    beyondCourses: [
      'Running a social media account for a business or organization',
      'Google Analytics certification or digital marketing courses',
      'DECA Marketing events',
      'Starting or marketing a small business',
      'Content creation portfolio (blog, YouTube, podcast)',
      'Market research projects with real data',
    ],

    admissionsOfficerPerspective:
      "Modern marketing is data science meets psychology meets storytelling. We're past the era of creative-only marketing. Top programs want students who understand consumer behavior (AP Psychology), can analyze data (AP Statistics), and communicate persuasively (AP English). The student who grew an Instagram account from zero to 10K followers with a deliberate strategy shows more marketing aptitude than the student who just took business classes.",

    commonMistakes: [
      'Thinking marketing is just creativity - modern marketing is heavily data-driven',
      'No AP Statistics (marketing analytics is now the core of the field)',
      'Not taking AP Psychology (understanding consumer behavior is essential)',
      'No real-world marketing experience (school club marketing, social media, etc.)',
      'Weak writing skills (marketing is fundamentally about communication)',
    ],

    catchUpStrategies: [
      'Take AP Statistics for the data analytics foundation',
      'Take AP Psychology to understand consumer behavior',
      'Volunteer to manage social media for a school club or local business',
      'Get Google Analytics certified (free) to show digital marketing skills',
      'Enter DECA marketing events to build competitive experience',
    ],
  },

  {
    major: 'Accounting',
    alternateNames: ['Public Accounting', 'CPA Track', 'Forensic Accounting', 'Tax Accounting'],
    specializationOf: 'Business / Economics',

    requirements: {
      minimum: ['AP Calculus AB or AP Statistics', 'Strong attention to detail', 'Solid math foundation'],
      competitive: [
        'AP Calculus AB or BC',
        'AP Statistics',
        'AP Microeconomics',
        'AP Macroeconomics',
        'Bookkeeping or accounting experience',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Statistics',
        'Both AP Economics',
        'AP Computer Science Principles',
        'Real-world accounting or bookkeeping experience',
        'Accounting software proficiency',
      ],
    },
    additionalRequirements: {
      competitive: ['Detail-oriented work habits', 'Basic bookkeeping knowledge'],
      exceptional: ['QuickBooks or accounting software experience', 'Volunteer Income Tax Assistance (VITA) or similar'],
    },

    beyondCourses: [
      'Bookkeeping for a school club, small business, or nonprofit',
      'FBLA Accounting or DECA Financial Literacy events',
      'Volunteer Income Tax Assistance (VITA) program',
      'Learning QuickBooks, Excel financial functions, or accounting software',
      'Business plan competitions with financial projections',
      'Personal finance management and budgeting projects',
    ],

    admissionsOfficerPerspective:
      "Accounting is the language of business - it requires precision, ethics, and analytical thinking. We want students who demonstrate attention to detail and integrity. The ones who manage the finances for a school club or help a family business with bookkeeping show genuine aptitude. AP Microeconomics and AP Statistics provide the analytical foundation. Strong ethics and attention to detail matter more than flashy activities.",

    commonMistakes: [
      'Thinking accounting is just math - it requires strong communication and ethics',
      'Not taking any AP Economics courses',
      'No real-world experience with financial records or bookkeeping',
      'Ignoring AP Statistics (auditing and forensic accounting use statistical sampling)',
      'Not developing Excel proficiency (it is essential in accounting)',
    ],

    catchUpStrategies: [
      'Volunteer to manage finances for a school club or organization',
      'Take AP Microeconomics for economic foundation',
      'Learn Excel financial functions and basic bookkeeping',
      'Look into VITA volunteer programs for tax preparation experience',
      'Enter FBLA Accounting events to build competitive credentials',
    ],
  },

  {
    major: 'Humanities',
    alternateNames: ['English', 'History', 'Philosophy', 'Literature', 'Classics', 'Art History'],

    requirements: {
      minimum: ['AP English (Language or Literature)', 'Strong writing evidenced in essays'],
      competitive: ['AP English Language AND Literature', 'AP History course(s)', 'Demonstrated writing excellence'],
      exceptional: [
        'Multiple AP English and History courses',
        'Published writing',
        'Academic competitions in humanities',
        'Original research or creative work',
      ],
    },

    beyondCourses: [
      'School newspaper or literary magazine',
      'Writing contests (Scholastic, etc.)',
      'Debate or Model UN',
      'Independent research or creative projects',
      'Reading lists beyond assigned texts',
    ],

    admissionsOfficerPerspective:
      "For humanities majors, your writing IS your calling card. The college essay matters enormously. We want to see intellectual curiosity - someone who reads, writes, and thinks because they love it, not because it's assigned.",

    commonMistakes: [
      'Weak college essay (this is your best chance to demonstrate the skill)',
      'No evidence of reading or writing beyond coursework',
      'Assuming humanities means you can ignore math/science entirely (you still need rigor)',
    ],

    catchUpStrategies: [
      'Start writing NOW - blog, journal, submit to magazines',
      'Read widely and be able to discuss what you read',
      'Enter writing competitions',
      "If behind on AP English courses, ensure your essays are exceptional to compensate",
    ],
  },

  // ========== APPLIED MATHEMATICS ==========
  {
    major: 'Applied Mathematics',
    alternateNames: ['Math', 'Mathematics', 'Applied Math', 'Computational Math', 'Mathematical Sciences', 'Quantitative Studies'],

    requirements: {
      minimum: ['AP Calculus BC', 'Strong performance across all math courses'],
      competitive: [
        'AP Calculus BC',
        'AP Statistics',
        'AP Physics (any)',
        'Linear Algebra (dual enrollment if available)',
        'Proof-based coursework',
      ],
      exceptional: [
        'AP Calculus BC (5 on exam)',
        'AP Statistics',
        'AP Physics C',
        'Multivariable Calculus (dual enrollment)',
        'Linear Algebra',
        'Real Analysis or proof-based course',
        'Math competition success (AMC, AIME, MATHCOUNTS)',
      ],
    },

    beyondCourses: [
      'AMC/AIME/USAMO competition track',
      'Math Olympiad training or participation',
      'Summer math programs (PROMYS, SUMaC, HCSSiM, Ross)',
      'Research projects involving mathematical modeling',
      'Independent study of higher mathematics',
      'Data science or statistical analysis projects',
    ],

    admissionsOfficerPerspective:
      "For applied math, we want students who see math as a language for solving real problems. Show us you've gone beyond the AP curriculum - competition scores, research, or advanced coursework through dual enrollment. Pure problem-solving ability plus curiosity about applications is the ideal combination.",

    commonMistakes: [
      'Stopping at Calculus BC without pursuing further mathematics',
      'No evidence of math interest beyond required coursework',
      'Weak physics (applied math often intersects with physical sciences)',
      'No exposure to proof-based or theoretical mathematics',
      'Claiming math interest but avoiding competitions or enrichment',
    ],

    catchUpStrategies: [
      'Take multivariable calculus and linear algebra through dual enrollment',
      'Start preparing for AMC 10/12 - these competitions demonstrate mathematical thinking',
      'Apply to summer math programs like PROMYS, Ross, or SUMaC',
      'Build projects using mathematical modeling (epidemiology, economics, physics)',
      'Self-study proof techniques to prepare for college-level rigor',
    ],
  },

  // ========== COMMUNICATIONS / MEDIA STUDIES ==========
  {
    major: 'Communications',
    alternateNames: ['Media Studies', 'Journalism', 'Public Relations', 'Broadcast', 'Digital Media', 'Film Studies', 'Strategic Communications'],

    requirements: {
      minimum: ['AP English Language OR Literature', 'Strong writing and verbal skills'],
      competitive: [
        'AP English Language',
        'AP English Literature',
        'AP US Government (for political communication)',
        'AP Psychology (for understanding audiences)',
        'Film/media production experience',
      ],
      exceptional: [
        'Both AP English courses',
        'AP US History',
        'AP Psychology',
        'Published journalism work',
        'Media production portfolio',
        'Leadership in school media organizations',
      ],
    },

    beyondCourses: [
      'School newspaper, yearbook, or broadcast program',
      'Podcast or YouTube channel with consistent content',
      'Internship at local news station, PR firm, or media company',
      'Social media management for organizations',
      'Film/video production projects',
      'Writing for external publications',
      'Debate, speech, or forensics participation',
    ],

    admissionsOfficerPerspective:
      "Communications is hands-on. We want to see you've already started communicating - school newspaper editor, podcast host, social media strategist. A portfolio of work matters more than specific AP courses. Show genuine interest in how information spreads and how media shapes perception.",

    commonMistakes: [
      'Strong GPA but no actual media/communications experience',
      'Claiming interest without any published or produced work',
      'Overlooking the analytical side (media studies requires critical thinking)',
      'No understanding of different media platforms and their audiences',
    ],

    catchUpStrategies: [
      'Start a blog, podcast, or YouTube channel NOW - build a body of work',
      'Join school newspaper or broadcast team, even if starting late',
      'Take AP English Language for rhetorical analysis skills',
      'Reach out to local news outlets for shadowing or internship opportunities',
      'Build a portfolio of writing samples and media projects',
    ],
  },

  // ========== ECONOMICS (Standalone) ==========
  {
    major: 'Economics',
    alternateNames: ['Econ', 'Economic Theory', 'Quantitative Economics', 'Mathematical Economics'],

    requirements: {
      minimum: ['AP Calculus (AB minimum)', 'AP Microeconomics OR Macroeconomics'],
      competitive: [
        'AP Calculus BC',
        'AP Statistics',
        'AP Microeconomics',
        'AP Macroeconomics',
        'Strong quantitative reasoning',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Statistics',
        'Both AP Economics courses',
        'Multivariable Calculus (dual enrollment)',
        'Independent economic research',
        'Economics competition success (Fed Challenge, Econ Olympiad)',
      ],
    },

    beyondCourses: [
      'Fed Challenge or Economics Olympiad competitions',
      'Investment club with analytical focus (not just stock picking)',
      'Economic research projects or data analysis',
      'Reading economics publications (The Economist, NBER papers)',
      'Internship involving economic analysis',
      'Personal projects analyzing economic data',
    ],

    admissionsOfficerPerspective:
      "Economics at selective schools is math-heavy. A student who took both AP Econ courses but avoided calculus raises red flags. We want to see quantitative capability plus genuine interest in how economies work - not just 'I want to make money.' Independent research or competition participation shows you think like an economist.",

    commonMistakes: [
      'Taking AP Economics but weak calculus (college econ requires heavy math)',
      'Interest in economics but no statistical or data analysis experience',
      'Confusing economics with business (economics is more theoretical and quantitative)',
      'No evidence of reading or thinking about economic issues',
    ],

    catchUpStrategies: [
      'Prioritize AP Calculus BC and AP Statistics',
      'Take both Micro and Macro economics',
      'Start an economics blog or write policy analysis pieces',
      'Learn basic econometrics and data analysis (Excel, R, or Python)',
      'Apply to economics summer programs or research opportunities',
    ],
  },

  // ========== PSYCHOLOGY ==========
  {
    major: 'Psychology',
    alternateNames: ['Psych', 'Behavioral Science', 'Cognitive Science', 'Neuroscience'],

    requirements: {
      minimum: ['AP Psychology', 'Strong science and math foundation'],
      competitive: [
        'AP Psychology',
        'AP Biology',
        'AP Statistics',
        'AP English (for research writing)',
        'Research experience',
      ],
      exceptional: [
        'AP Psychology',
        'AP Biology',
        'AP Statistics',
        'AP Chemistry (for neuroscience)',
        'AP Calculus',
        'Published research or independent study',
        'Substantial clinical/volunteer experience',
      ],
    },

    beyondCourses: [
      'Research assistant position with psychology professor',
      'Volunteer work in mental health settings',
      'Peer counseling or crisis line volunteering',
      'Psychology-related clubs or tutoring',
      'Reading psychology research beyond AP curriculum',
      'Independent research project on psychological topic',
    ],

    admissionsOfficerPerspective:
      "Psychology is a science, and at strong programs, it's research-heavy. We want to see AP Psychology plus AP Biology and AP Statistics - the scientific foundation. But we also want to see genuine curiosity about human behavior. Clinical volunteering shows you understand the applied side. Research experience, even at a basic level, shows you understand psychology as a science.",

    commonMistakes: [
      'Only taking AP Psychology without supporting sciences (Biology, Statistics)',
      'Interest in psychology but no research or clinical exposure',
      'Not realizing psychology programs are math/statistics-intensive',
      'Vague motivation ("I want to help people") without specificity',
    ],

    catchUpStrategies: [
      'Take AP Statistics - essential for psychology research',
      'Add AP Biology for neuroscience foundation',
      'Email local university psychology departments about volunteer research',
      'Volunteer with peer counseling, crisis lines, or mental health organizations',
      'Design and conduct your own small research study (survey-based)',
    ],
  },

  // ========== VISUAL ARTS ==========
  {
    major: 'Visual Arts',
    alternateNames: ['Fine Arts', 'Studio Art', 'Art', 'Graphic Design', 'Illustration', 'Painting', 'Sculpture', 'Photography'],

    requirements: {
      minimum: ['Strong art portfolio (15-20 pieces)', 'AP Studio Art or equivalent coursework'],
      competitive: [
        'AP Studio Art 2D or 3D',
        'AP Art History',
        'Strong observational drawing skills',
        'Portfolio demonstrating range and depth',
        'Pre-college art program participation',
      ],
      exceptional: [
        'AP Studio Art (high portfolio score)',
        'AP Art History',
        'Scholastic Art Awards or similar recognition',
        'Pre-college program at top art school',
        'Gallery exhibition or professional exposure',
        'Strong personal artistic voice',
      ],
    },

    beyondCourses: [
      'Scholastic Art and Writing Awards submissions',
      'Pre-college summer programs at RISD, Pratt, SAIC, CalArts',
      'Local gallery exhibitions or art shows',
      'Art museum volunteering or internship',
      'Community art teaching or workshops',
      'Personal artistic projects beyond school requirements',
      'Building a cohesive online portfolio (Behance, personal website)',
    ],

    admissionsOfficerPerspective:
      "Your portfolio is 70-80% of your application to art schools. We want to see: 1) Technical skill through observational work, 2) Creative thinking through conceptual projects, 3) A developing personal voice, and 4) Process documentation showing how you think. AP Art History adds intellectual depth to your studio practice.",

    commonMistakes: [
      'Portfolio without observational drawing (art schools require this foundation)',
      'All digital work without traditional media skills',
      'Copies of other artists or fan art (show YOUR vision)',
      'No cohesion or voice - random collection of work',
      'Poor documentation of process (sketchbooks matter)',
      'Neglecting academics entirely (you still need reasonable grades)',
    ],

    catchUpStrategies: [
      'Focus on building observational drawing skills - still life, self-portraits',
      'Apply to pre-college summer programs at art schools',
      'Submit to Scholastic Art Awards and regional competitions',
      'Take AP Art History to develop critical thinking about art',
      'Create a concentrated body of work exploring specific themes',
      'Build an organized digital portfolio showing range and depth',
    ],
  },

  // ========== PERFORMING ARTS (Music/Theater) ==========
  {
    major: 'Performing Arts',
    alternateNames: ['Music', 'Theater', 'Drama', 'Dance', 'Musical Theater', 'Music Performance', 'Acting', 'Vocal Performance'],

    requirements: {
      minimum: ['Strong audition/performance ability', 'Years of training in your discipline'],
      competitive: [
        'AP Music Theory (for music majors)',
        'Consistent private instruction (5+ years ideal)',
        'Competition or festival participation',
        'Performance experience (recitals, productions)',
        'Solid academic record alongside arts',
      ],
      exceptional: [
        'AP Music Theory (5 on exam for music)',
        'Regional/national competition awards',
        'Prestigious summer program (Interlochen, Tanglewood, etc.)',
        'Professional performance experience',
        'Strong academic record (for BA programs)',
        'Music composition or original creative work',
      ],
    },

    beyondCourses: [
      'State and regional competitions (solo, ensemble)',
      'Honor ensembles (All-State, regional orchestras)',
      'Summer conservatory programs (Interlochen, Tanglewood, Boston University Tanglewood Institute)',
      'Community theater or professional productions',
      'Master classes with professional artists',
      'Private instruction with recognized teachers',
      'Original compositions or choreography',
    ],

    admissionsOfficerPerspective:
      "For conservatory programs, the audition is everything - typically 70-90% of the decision. We assess current ability AND growth potential. Training history matters (years of lessons, quality of teachers). For BA programs, we balance artistic promise with academic capability. The most competitive applicants have both competition success AND a compelling artistic identity.",

    commonMistakes: [
      'Underprepared audition (practice repertoire extensively)',
      'No private instruction history (shows lack of serious commitment)',
      'Choosing the wrong repertoire for your level',
      'Neglecting academics entirely (even conservatories have minimums)',
      'Not researching what specific programs want in auditions',
      'Lacking performance experience (you need stage comfort)',
    ],

    catchUpStrategies: [
      'Find the best private teacher available - start NOW',
      'Audition for honor ensembles and competitions',
      'Apply to summer programs at conservatories',
      'Build performance experience through any available opportunities',
      'Take AP Music Theory if pursuing music',
      'Research specific audition requirements for target schools',
    ],
  },

  // ========== POLITICAL SCIENCE / LAW ==========
  {
    major: 'Political Science',
    alternateNames: ['PoliSci', 'Government', 'International Relations', 'Pre-Law', 'Public Policy', 'International Affairs'],

    requirements: {
      minimum: ['AP US Government OR AP US History', 'Strong writing skills'],
      competitive: [
        'AP US Government',
        'AP Comparative Government',
        'AP US History',
        'AP English Language',
        'Debate or Model UN experience',
      ],
      exceptional: [
        'AP US Government',
        'AP Comparative Government',
        'Multiple AP History courses',
        'Both AP English courses',
        'AP Statistics (for policy analysis)',
        'National-level debate/MUN success',
        'Political campaign or government internship',
      ],
    },

    beyondCourses: [
      'Debate team (Policy, Lincoln-Douglas, Public Forum)',
      'Model United Nations',
      'Mock Trial',
      'Student government with actual policy work',
      'Campaign volunteering or political internship',
      'Op-ed writing or political blog',
      'Civic engagement organizations',
    ],

    admissionsOfficerPerspective:
      "For political science and pre-law, we want to see engagement with political ideas and institutions - not just general interest. Debate experience shows analytical thinking and public speaking. Government or campaign internships show practical understanding. The best applicants combine academic rigor (AP Government, History) with real-world political engagement.",

    commonMistakes: [
      'Interest in politics but no courses in government or history',
      'No debate, MUN, or similar analytical experience',
      'Vague interest in "changing the world" without specific policy knowledge',
      'Weak writing skills (law and policy are writing-intensive)',
      'No evidence of engaging with political issues beyond opinions',
    ],

    catchUpStrategies: [
      'Join debate team - even starting junior year adds value',
      'Take both AP Government courses if available',
      'Seek internships with local government, campaigns, or advocacy organizations',
      'Write op-eds for school newspaper on political/policy issues',
      'Join or start a political discussion or policy analysis club',
    ],
  },

  // ========== NURSING / HEALTH SCIENCES ==========
  {
    major: 'Nursing',
    alternateNames: ['BSN', 'Health Sciences', 'Pre-Nursing', 'Nursing Science', 'Healthcare', 'Public Health'],

    requirements: {
      minimum: ['AP Biology', 'Strong math and science GPA'],
      competitive: [
        'AP Biology',
        'AP Chemistry',
        'AP Statistics or Calculus',
        'AP Psychology',
        'Healthcare volunteering experience',
      ],
      exceptional: [
        'AP Biology',
        'AP Chemistry',
        'AP Statistics',
        'AP Psychology',
        'Substantial clinical volunteering (100+ hours)',
        'CNA certification or healthcare work experience',
        'Strong leadership in health-related organizations',
      ],
    },

    beyondCourses: [
      'Hospital or clinic volunteering (aim for consistent, long-term commitment)',
      'CNA (Certified Nursing Assistant) certification',
      'Red Cross or EMT training',
      'Shadowing nurses in different specialties',
      'Health-related clubs or peer health education',
      'Research experience in health sciences',
      'Community health outreach or education projects',
    ],

    admissionsOfficerPerspective:
      "Nursing programs are highly competitive - many top BSN programs accept fewer than 30% of applicants. We look for strong science grades (not just AP scores), genuine patient care experience, and emotional maturity. Volunteering in healthcare settings is near-essential - we need to see you understand what nursing actually involves. Leadership experience matters because nurses coordinate care across teams.",

    commonMistakes: [
      'No direct patient care or healthcare exposure',
      'Weak chemistry (nursing programs require organic chemistry)',
      'Only academic credentials without compassion/service evidence',
      'Not understanding the physical demands of nursing',
      'Applying without researching specific program prerequisites',
    ],

    catchUpStrategies: [
      'Start volunteering at a hospital or clinic immediately',
      'Take AP Chemistry if you haven\'t - it\'s required for most programs',
      'Get CNA certified - it shows commitment and gives clinical experience',
      'Shadow nurses in multiple specialties to understand the profession',
      'Take AP Statistics for research literacy in evidence-based practice',
    ],
  },

  // ========== EDUCATION / TEACHING ==========
  {
    major: 'Education',
    alternateNames: ['Teaching', 'Elementary Education', 'Secondary Education', 'Special Education', 'Early Childhood Education', 'Education Studies'],

    requirements: {
      minimum: ['Strong GPA across all subjects', 'AP courses in your content area (for secondary education)'],
      competitive: [
        'AP courses in intended teaching subject area',
        'AP Psychology (understanding child development)',
        'AP English Language (for literacy instruction)',
        'Tutoring or teaching experience',
        'Working with children/youth',
      ],
      exceptional: [
        'Multiple APs in content area',
        'AP Psychology',
        'AP Statistics (for educational research)',
        'Sustained tutoring or mentoring experience',
        'Working with diverse student populations',
        'Leadership in educational organizations',
        'Study of child/adolescent development',
      ],
    },

    beyondCourses: [
      'Tutoring peers or younger students consistently',
      'Youth mentoring programs (Big Brothers/Big Sisters, etc.)',
      'Camp counselor or youth group leader',
      'Volunteer teaching or after-school program support',
      'Coaching youth sports or activities',
      'Working with students with special needs',
      'Teaching Sunday school, community classes, or workshops',
    ],

    admissionsOfficerPerspective:
      "Education programs want students who genuinely love working with young people AND have academic depth in content areas. Show us sustained experience with children or teens - not just one-off volunteering. For secondary education, strong content knowledge (math, science, English, etc.) is critical. We also value candidates who have worked with diverse populations.",

    commonMistakes: [
      'No experience working with children or youth',
      'Weak content knowledge in intended teaching area',
      'Viewing education as an "easy" major (it\'s not)',
      'No understanding of educational equity issues',
      'Lacking patience or communication skills evidence',
    ],

    catchUpStrategies: [
      'Start tutoring - school programs, community organizations, or privately',
      'Volunteer at after-school programs, summer camps, or youth organizations',
      'Take strong AP courses in the subject you want to teach',
      'Shadow teachers in local schools to understand the profession',
      'Get experience with diverse student populations',
    ],
  },

  // ========== ARCHITECTURE ==========
  {
    major: 'Architecture',
    alternateNames: ['Architectural Studies', 'Architectural Design', 'Landscape Architecture', 'Urban Design'],

    requirements: {
      minimum: ['AP Calculus (AB minimum)', 'Strong visual/spatial portfolio or art experience'],
      competitive: [
        'AP Calculus AB or BC',
        'AP Physics 1 or C',
        'AP Art History',
        'AP Studio Art (2D or Drawing)',
        'Freehand drawing ability',
        'Design portfolio',
      ],
      exceptional: [
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Art History',
        'AP Studio Art with strong portfolio',
        'Pre-college architecture program',
        'Design competition participation',
        'Architectural internship or shadowing',
      ],
    },

    beyondCourses: [
      'Pre-college architecture programs (many schools offer summer programs)',
      'Freehand sketching and architectural drawing practice',
      'Model building (physical and digital)',
      'Learning CAD/3D modeling software (SketchUp, Rhino, AutoCAD)',
      'Visiting and studying notable buildings and urban spaces',
      'Photography of architectural subjects',
      'Sustainable design projects or competitions',
    ],

    admissionsOfficerPerspective:
      "Architecture uniquely requires both analytical and creative abilities. We need to see strong math and physics (structures require engineering knowledge) alongside visual/spatial thinking. A portfolio showing observational drawing, spatial awareness, and design thinking is crucial. Many programs require a portfolio and/or a creative exercise as part of the application. Pre-college programs at architecture schools signal serious interest.",

    commonMistakes: [
      'Strong art portfolio but weak math/physics (structures require engineering)',
      'Strong STEM but no drawing or design experience',
      'Portfolio of only digital work without freehand drawing',
      'No understanding of what architects actually do day-to-day',
      'Not researching whether programs require a portfolio (many do)',
    ],

    catchUpStrategies: [
      'Take AP Calculus and AP Physics - both are crucial',
      'Start freehand sketching daily - architectural subjects especially',
      'Apply to a pre-college architecture summer program',
      'Learn basic 3D modeling software (SketchUp is free)',
      'Take AP Art History for historical context of built environment',
      'Visit architecture schools and learn about portfolio requirements',
    ],
  },

  // ========== ENVIRONMENTAL SCIENCE / SUSTAINABILITY ==========
  {
    major: 'Environmental Science',
    alternateNames: ['Environmental Studies', 'Sustainability', 'Ecology', 'Conservation Biology', 'Earth Science', 'Climate Science'],

    requirements: {
      minimum: ['AP Environmental Science OR AP Biology', 'Strong science GPA'],
      competitive: [
        'AP Environmental Science',
        'AP Biology',
        'AP Chemistry',
        'AP Statistics',
        'Field research or environmental volunteering',
      ],
      exceptional: [
        'AP Environmental Science',
        'AP Biology',
        'AP Chemistry',
        'AP Statistics or Calculus',
        'AP Human Geography',
        'Environmental research experience',
        'Sustained environmental advocacy or project leadership',
      ],
    },

    beyondCourses: [
      'Environmental club leadership or founding',
      'Water quality testing or ecological monitoring projects',
      'Sustainability initiatives at school or in community',
      'Wildlife conservation volunteering',
      'Environmental policy advocacy',
      'Nature journaling or field observation',
      'GIS (Geographic Information Systems) exposure',
      'Climate action or environmental justice projects',
    ],

    admissionsOfficerPerspective:
      "Environmental science is inherently interdisciplinary. We want students who understand the science AND the policy/social dimensions. Strong performance in AP Environmental Science, Biology, and Chemistry shows scientific foundation. But we also want to see genuine environmental engagement - leading sustainability projects, doing field research, or advocating for environmental policy. This field attracts passionate students; show us what you've actually done.",

    commonMistakes: [
      'Passion for environment but weak science foundation',
      'Only taking AP Environmental Science without supporting sciences',
      'No hands-on environmental experience (field work, research, volunteering)',
      'Not understanding the quantitative demands of environmental science',
      'Vague interest in "saving the planet" without specific knowledge or action',
    ],

    catchUpStrategies: [
      'Take AP Biology and AP Chemistry alongside AP Environmental Science',
      'Start or join an environmental club at your school',
      'Volunteer with local conservation organizations',
      'Conduct a local environmental research project (water quality, biodiversity survey)',
      'Take AP Statistics for data analysis in environmental research',
    ],
  },

  // ========== BIOCHEMISTRY / BIOMEDICAL SCIENCES ==========
  {
    major: 'Biochemistry',
    alternateNames: ['Biomedical Sciences', 'Molecular Biology', 'Chemical Biology'],

    requirements: {
      minimum: ['AP Biology', 'AP Chemistry', 'AP Calculus (AB minimum)'],
      competitive: [
        'AP Biology',
        'AP Chemistry',
        'AP Calculus BC',
        'AP Physics (any)',
        'AP Statistics',
        'Research experience',
      ],
      exceptional: [
        'AP Biology',
        'AP Chemistry',
        'AP Calculus BC',
        'AP Physics C',
        'AP Statistics',
        'Genuine research experience in a lab',
        'Science competition success (Science Olympiad, ISEF, Regeneron)',
        'Published or presented research',
      ],
    },

    beyondCourses: [
      'University lab research assistant positions',
      'Science Olympiad or science bowl participation',
      'Science fair projects (ISEF pathway)',
      'Independent research projects in molecular biology',
      'Summer research programs at universities',
      'Volunteering in clinical or research settings',
      'Reading scientific journals in areas of interest',
    ],

    admissionsOfficerPerspective:
      "Biochemistry sits at the intersection of biology and chemistry, and we expect strong performance in both. The best applicants have genuine research experience - even a summer in a university lab shows you understand what biochemistry looks like in practice. For biomedical engineering, add strong physics and calculus. We want students who can handle the quantitative rigor AND have genuine scientific curiosity.",

    commonMistakes: [
      'Strong biology but weak chemistry (or vice versa)',
      'No lab research experience',
      'Avoiding calculus (biochemistry increasingly requires quantitative skills)',
      'No physics for biomedical engineering track',
      'Confusing pre-med with biochemistry (they overlap but aren\'t identical)',
    ],

    catchUpStrategies: [
      'Ensure you take BOTH AP Biology and AP Chemistry',
      'Email university professors about summer research opportunities',
      'Join Science Olympiad - events cover biochemistry topics',
      'Take AP Calculus BC for quantitative foundation',
      'Read about current biochemistry research to find your interests',
    ],
  },

  // ========== NEUROSCIENCE ==========
  {
    major: 'Neuroscience',
    alternateNames: ['Cognitive Neuroscience', 'Behavioral Neuroscience', 'Computational Neuroscience', 'Brain Science'],

    requirements: {
      minimum: ['AP Biology', 'AP Psychology', 'Strong math foundation'],
      competitive: [
        'AP Biology',
        'AP Psychology',
        'AP Chemistry',
        'AP Calculus',
        'AP Statistics',
        'Research or clinical experience',
      ],
      exceptional: [
        'AP Biology',
        'AP Psychology',
        'AP Chemistry',
        'AP Calculus BC',
        'AP Statistics',
        'AP Physics',
        'Neuroscience research experience',
        'Programming exposure (for computational neuroscience)',
      ],
    },

    beyondCourses: [
      'Neuroscience research in a university lab',
      'Brain Bee competition',
      'Psychology or neuroscience-focused independent study',
      'Volunteering with neurological patient populations',
      'Cognitive science reading (popular neuroscience books)',
      'Programming for data analysis (Python, R)',
      'Clinical shadowing in neurology or psychiatry',
    ],

    admissionsOfficerPerspective:
      "Neuroscience is one of the most interdisciplinary sciences - it requires biology, chemistry, psychology, physics, and increasingly computer science. We look for students who embrace this breadth. Research experience is highly valued because neuroscience is a research-driven field. Show us you understand the brain interests you scientifically, not just philosophically.",

    commonMistakes: [
      'Taking AP Psychology but not AP Biology (neuroscience is fundamentally biological)',
      'Avoiding chemistry (neurotransmitters, pharmacology require chemistry)',
      'No research experience in a relevant lab',
      'Weak math/statistics (modern neuroscience is data-intensive)',
      'Confusing neuroscience with psychology (more overlap at some schools than others)',
    ],

    catchUpStrategies: [
      'Take AP Biology AND AP Chemistry - both are essential',
      'AP Statistics is critical for understanding neuroscience research',
      'Seek neuroscience research opportunities at local universities',
      'Compete in Brain Bee competitions',
      'Learn basic programming (Python) for computational neuroscience',
    ],
  },

  // ========== DATA SCIENCE / INFORMATION SCIENCE ==========
  {
    major: 'Data Science',
    alternateNames: ['Information Science', 'Informatics', 'Computational Data Science', 'Analytics', 'Statistics and Data Science'],

    requirements: {
      minimum: ['AP Statistics', 'AP Computer Science (A or Principles)', 'AP Calculus (AB minimum)'],
      competitive: [
        'AP Statistics',
        'AP Computer Science A',
        'AP Calculus BC',
        'Programming experience beyond AP',
        'Data analysis projects',
      ],
      exceptional: [
        'AP Statistics',
        'AP Computer Science A',
        'AP Calculus BC',
        'Linear Algebra (dual enrollment)',
        'Substantial programming portfolio',
        'Data science competition success (Kaggle, DataDriven)',
        'Independent data analysis projects with real datasets',
      ],
    },

    beyondCourses: [
      'Personal data analysis projects using public datasets',
      'Kaggle competitions or data science challenges',
      'Learning Python (pandas, NumPy) or R for data analysis',
      'Data visualization projects',
      'Machine learning experimentation',
      'Statistical analysis for school or community organizations',
      'Building interactive dashboards or data applications',
    ],

    admissionsOfficerPerspective:
      "Data science is at the intersection of statistics, computer science, and domain expertise. We want students strong in all three: mathematical/statistical thinking (AP Stats, AP Calc), programming ability (AP CS A, personal projects), and curiosity about applying data to real-world problems. A portfolio of data projects speaks volumes - show us you can find, clean, analyze, and communicate insights from real data.",

    commonMistakes: [
      'Taking AP CS Principles but not AP CS A (data science requires real programming)',
      'Strong coding but weak statistics',
      'No hands-on experience with actual data analysis',
      'Not learning Python or R outside of class',
      'No domain expertise or application area',
    ],

    catchUpStrategies: [
      'Take AP Statistics AND AP Computer Science A',
      'Learn Python with pandas and matplotlib - free resources everywhere',
      'Start a data analysis project using a public dataset you care about',
      'Take AP Calculus BC for the mathematical foundation',
      'Participate in a Kaggle competition or similar data challenge',
    ],
  },

  // ========== SOCIOLOGY / ANTHROPOLOGY ==========
  {
    major: 'Sociology',
    alternateNames: ['Anthropology', 'Social Sciences', 'Cultural Studies', 'Social Work', 'Human Services'],

    requirements: {
      minimum: ['AP course in social sciences', 'Strong reading and writing skills'],
      competitive: [
        'AP Psychology',
        'AP US History or AP World History',
        'AP Statistics',
        'AP English Language',
        'Community service or social justice engagement',
      ],
      exceptional: [
        'AP Psychology',
        'AP Statistics',
        'Multiple AP History courses',
        'AP English Language',
        'AP Human Geography',
        'Research experience in social sciences',
        'Sustained community engagement or social justice work',
        'Cultural immersion experiences',
      ],
    },

    beyondCourses: [
      'Community service with diverse populations',
      'Social justice or advocacy organizations',
      'Cross-cultural experiences (exchange programs, community work)',
      'Independent research projects on social issues',
      'Volunteer work with underserved communities',
      'Documentary or media projects on social topics',
      'Ethnographic observation or interview projects',
    ],

    admissionsOfficerPerspective:
      "Sociology and anthropology programs want students who are genuinely curious about how societies and cultures work. We value AP Statistics because modern social science is data-driven. Show us engagement with social issues - not just awareness, but active involvement. Research experience, even informal ethnographic projects, demonstrates the mindset we're looking for. Cross-cultural experience matters.",

    commonMistakes: [
      'Interest in social issues but no social science coursework',
      'Avoiding statistics (modern sociology is heavily quantitative)',
      'No direct engagement with communities different from your own',
      'Confusing sociology with social work (related but distinct)',
      'Only reading about social issues without taking action',
    ],

    catchUpStrategies: [
      'Take AP Psychology and AP Statistics',
      'Volunteer with community organizations serving diverse populations',
      'Conduct a small research project (survey, interviews) on a social question',
      'Read sociological works (Malcolm Gladwell, Ta-Nehisi Coates, etc.)',
      'Join organizations focused on social justice or community service',
    ],
  },

  // ========== FILM / CINEMA STUDIES ==========
  {
    major: 'Film',
    alternateNames: ['Cinema Studies', 'Film Production', 'Screenwriting', 'Film and Media Arts', 'Television', 'Digital Filmmaking'],

    requirements: {
      minimum: ['AP English Literature or Language', 'Film/video production experience'],
      competitive: [
        'AP English Literature',
        'AP Art History',
        'AP US History or World History',
        'Portfolio of short films or video work',
        'Photography experience',
      ],
      exceptional: [
        'Both AP English courses',
        'AP Art History',
        'Strong creative portfolio (short films, screenplays)',
        'Film festival submissions or awards',
        'Pre-college film program experience',
        'Industry exposure (internships, mentorships)',
        'Understanding of film history and theory',
      ],
    },

    beyondCourses: [
      'Producing short films with complete production process',
      'Screenwriting (completed scripts, not just ideas)',
      'Film festival submissions (many have student categories)',
      'Pre-college film programs at universities',
      'Photography and visual storytelling practice',
      'Film club or school media production team',
      'Internships at production companies or local studios',
      'Building a YouTube channel or online portfolio',
    ],

    admissionsOfficerPerspective:
      "Film programs are portfolio-driven. We want to see completed work - short films, screenplays, or creative reels that show storytelling ability, visual sense, and technical competence. You don't need expensive equipment; compelling stories shot on a phone beat bland content on a RED camera. We also look for film literacy - can you discuss films intelligently? AP English and Art History show you understand narrative and visual tradition.",

    commonMistakes: [
      'No completed films in portfolio (ideas aren\'t enough)',
      'All technical skill but no storytelling ability',
      'Only fan films or recreations without original vision',
      'No understanding of film history or theory',
      'Neglecting writing skills (screenwriting is the foundation)',
      'Expecting to skip academics for pure filmmaking',
    ],

    catchUpStrategies: [
      'Start making short films NOW - even with a phone',
      'Write screenplays and have others read them',
      'Study film history by watching classic and international films',
      'Take AP English Literature for narrative analysis skills',
      'Submit to student film festivals',
      'Build a showreel or portfolio website',
    ],
  },

  // ========== INTERNATIONAL RELATIONS ==========
  {
    major: 'International Relations',
    alternateNames: ['International Affairs', 'Global Studies', 'International Studies', 'Foreign Affairs', 'Diplomacy'],

    requirements: {
      minimum: ['AP World History OR AP Comparative Government', 'AP-level language course', 'Strong writing'],
      competitive: [
        'AP Comparative Government',
        'AP World History',
        'AP US Government',
        'AP language course (any)',
        'AP Macroeconomics',
        'Model UN or debate experience',
      ],
      exceptional: [
        'AP Comparative Government',
        'AP World History',
        'AP US Government',
        'AP language course (advanced or multiple)',
        'Both AP Economics courses',
        'AP Statistics',
        'National-level MUN or debate awards',
        'International experience or cultural immersion',
      ],
    },

    beyondCourses: [
      'Model United Nations (especially national/international conferences)',
      'Language immersion or exchange programs',
      'Global affairs clubs or international student organizations',
      'Internships with international organizations or NGOs',
      'Writing about international issues for publications',
      'Cross-cultural service projects',
      'Following and analyzing global current events',
    ],

    admissionsOfficerPerspective:
      "International Relations requires a global mindset AND academic rigor. We want to see: language proficiency (at least one foreign language at AP level), understanding of comparative political systems, and genuine engagement with global issues. Model UN is great but we also want to see independent thinking - op-eds, research papers, or policy analysis. International experience (travel, exchange, cultural immersion) shows you can navigate different perspectives.",

    commonMistakes: [
      'Interest in world affairs but no foreign language proficiency',
      'No AP Government or AP History courses',
      'Only domestic perspective without comparative or global coursework',
      'MUN participation without deeper analytical engagement',
      'Weak economics (IR increasingly requires quantitative literacy)',
    ],

    catchUpStrategies: [
      'Take AP Comparative Government and AP World History',
      'Pursue AP-level language study (Spanish, French, Chinese are most versatile)',
      'Join Model UN and aim for leadership positions',
      'Take AP Macroeconomics for international economic literacy',
      'Seek internships with international organizations',
    ],
  },

  // ========== PHILOSOPHY ==========
  {
    major: 'Philosophy',
    alternateNames: ['Ethics', 'Logic', 'Philosophy and Religion', 'Religious Studies'],

    requirements: {
      minimum: ['AP English Literature or Language', 'Strong analytical writing', 'Rigorous course load'],
      competitive: [
        'AP English Literature',
        'AP European History',
        'AP Calculus or Statistics (logic/reasoning)',
        'AP Psychology',
        'Demonstrated philosophical reading/thinking',
      ],
      exceptional: [
        'AP English Literature',
        'AP European History',
        'AP Calculus (formal logic connections)',
        'AP Psychology',
        'AP US Government or Comparative Government',
        'Independent philosophical reading and writing',
        'Ethics bowl or philosophy competitions',
        'Original philosophical essays or blog',
      ],
    },

    beyondCourses: [
      'Ethics Bowl competition (regional and national)',
      'Philosophy clubs or discussion groups',
      'Independent reading of primary philosophical texts',
      'Writing philosophical essays for competitions or publications',
      'Debate (especially Lincoln-Douglas for its philosophical dimensions)',
      'Community ethics discussions or workshops',
      'Exploring connections between philosophy and other disciplines',
    ],

    admissionsOfficerPerspective:
      "Philosophy programs want students who think carefully and write precisely. We look for intellectual curiosity that goes beyond what's taught in class - students who read Plato, Kant, or Singer on their own. AP European History shows engagement with the history of ideas. AP Calculus might seem odd, but formal logic and mathematical reasoning are core to philosophy. The best applicants can articulate their own philosophical questions, not just summarize others.",

    commonMistakes: [
      'Interest in "deep thinking" without actual philosophical reading',
      'Weak writing skills (philosophy is essentially writing-intensive)',
      'No engagement with logic or formal reasoning',
      'Only interested in one philosophical tradition',
      'Confusing philosophy with personal opinions',
    ],

    catchUpStrategies: [
      'Start reading primary philosophical texts (start with accessible ones: Mill, Singer, Nozick)',
      'Join or start a philosophy discussion group',
      'Participate in Ethics Bowl if available',
      'Take AP English Literature for close reading skills',
      'Take AP European History for intellectual history context',
      'Write philosophical essays and seek feedback',
    ],
  },

  // ========== KINESIOLOGY / EXERCISE SCIENCE ==========
  {
    major: 'Kinesiology',
    alternateNames: ['Exercise Science', 'Sports Science', 'Athletic Training', 'Physical Therapy (Pre-PT)', 'Sports Medicine'],

    requirements: {
      minimum: ['AP Biology', 'Strong science and math GPA', 'Athletic or fitness interest'],
      competitive: [
        'AP Biology',
        'AP Chemistry',
        'AP Physics 1',
        'AP Psychology',
        'AP Statistics',
        'Athletic participation or coaching experience',
      ],
      exceptional: [
        'AP Biology',
        'AP Chemistry',
        'AP Physics 1 or 2',
        'AP Psychology',
        'AP Statistics',
        'AP Calculus',
        'Athletic training or physical therapy shadowing',
        'Certified personal training or coaching experience',
        'Research in exercise science or biomechanics',
      ],
    },

    beyondCourses: [
      'Athletic training room experience (school team support)',
      'Physical therapy clinic volunteering or shadowing',
      'Personal training certification (NASM, ACE)',
      'Youth coaching or sports instruction',
      'Sports medicine or biomechanics research',
      'First aid and CPR certification',
      'Exercise programming for community groups',
    ],

    admissionsOfficerPerspective:
      "Kinesiology bridges science and human movement. We want students who understand the science (biology, chemistry, physics of biomechanics) AND have practical experience with physical activity and wellness. Athletic participation alone isn't enough - we want to see interest in the science behind movement. Shadowing in physical therapy, athletic training, or sports medicine demonstrates understanding of the career path.",

    commonMistakes: [
      'Being an athlete but taking no science courses',
      'No shadowing or exposure to sports medicine/PT careers',
      'Avoiding chemistry and physics (biomechanics requires both)',
      'Not taking AP Statistics (research methodology is central)',
      'Thinking kinesiology is "just PE" (it\'s a rigorous science)',
    ],

    catchUpStrategies: [
      'Take AP Biology and AP Chemistry for scientific foundation',
      'Shadow physical therapists, athletic trainers, or exercise physiologists',
      'Get first aid/CPR certified',
      'Volunteer in your school\'s athletic training room',
      'Take AP Physics for biomechanics understanding',
    ],
  },

  // =========================================================================
  // SPECIFIC SCIENCE MAJORS
  // =========================================================================

  {
    major: 'Physics',
    alternateNames: ['Applied Physics', 'Astrophysics', 'Physics and Astronomy', 'Biophysics', 'Geophysics'],

    requirements: {
      minimum: ['AP Physics C: Mechanics', 'AP Calculus BC', 'Strong mathematical reasoning'],
      competitive: [
        'AP Physics C: Mechanics',
        'AP Physics C: E&M',
        'AP Calculus BC',
        'AP Statistics',
        'Independent physics research or Science Olympiad',
      ],
      exceptional: [
        'AP Physics C: Mechanics',
        'AP Physics C: E&M',
        'AP Calculus BC',
        'AP Statistics',
        'AP Computer Science A',
        'Physics research with a university mentor',
        'Physics Olympiad (F=ma, USAPhO)',
        'Linear algebra or differential equations self-study',
      ],
    },

    beyondCourses: [
      'Physics Olympiad competitions (F=ma exam, USAPhO)',
      'Science Olympiad physics events',
      'Independent research at a university physics lab',
      'MIT OpenCourseWare or similar advanced physics self-study',
      'Computational physics projects (Python simulations)',
      'Astronomy club or observatory volunteering',
    ],

    admissionsOfficerPerspective:
      "Physics is the most mathematically demanding of the pure sciences. We expect both AP Physics C courses (Mechanics AND E&M) - if you only took Physics 1, you're not ready for a physics major at a competitive school. AP Calculus BC is absolutely non-negotiable; multi-variable calculus before college is a significant advantage. What really sets applicants apart is showing genuine curiosity - the student who built a cloud chamber, participated in Physics Olympiad, or did computational simulations shows the kind of deep intellectual engagement we want.",

    commonMistakes: [
      'Taking only AP Physics 1 instead of Physics C (algebra-based isn\'t sufficient for a physics major)',
      'Not taking AP Physics C: E&M in addition to Mechanics',
      'Stopping at Calculus AB (physics requires BC and beyond)',
      'No computational skills (modern physics is heavily computational)',
      'Only doing well in class without independent exploration or research',
    ],

    catchUpStrategies: [
      'Take AP Physics C: Mechanics AND E&M - both are essential',
      'Ensure you take AP Calculus BC, not just AB',
      'Start learning Python for computational physics simulations',
      'Participate in F=ma or Science Olympiad physics events',
      'Reach out to a local university physics professor about shadowing or assisting research',
    ],
  },

  {
    major: 'Chemistry',
    alternateNames: ['Chemical Sciences', 'Inorganic Chemistry', 'Organic Chemistry', 'Physical Chemistry', 'Analytical Chemistry'],

    requirements: {
      minimum: ['AP Chemistry', 'AP Calculus AB', 'Strong lab skills'],
      competitive: [
        'AP Chemistry',
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Biology',
        'Chemistry Olympiad or Science Olympiad',
      ],
      exceptional: [
        'AP Chemistry',
        'AP Calculus BC',
        'AP Physics C: Mechanics',
        'AP Biology',
        'AP Statistics',
        'USNCO (US National Chemistry Olympiad) participation',
        'Research in a university chemistry lab',
      ],
    },

    beyondCourses: [
      'USNCO (US National Chemistry Olympiad) preparation and competition',
      'Science Olympiad chemistry events',
      'Research in a university chemistry or materials science lab',
      'ACS ChemMatters or chemistry publication reading',
      'Environmental chemistry or materials science projects',
      'Pharmaceutical or food science internships',
    ],

    admissionsOfficerPerspective:
      "Chemistry sits at the intersection of physics and biology - strong chemistry majors need both quantitative rigor and lab intuition. AP Chemistry is obviously required, but we're looking beyond that: AP Calculus BC for the physical chemistry you'll take sophomore year, AP Physics for understanding molecular behavior, and ideally research experience that shows you can work independently in a lab. USNCO participants show a level of dedication and knowledge that goes well beyond the AP curriculum.",

    commonMistakes: [
      'Only taking AP Chemistry without AP Physics (physical chemistry requires both)',
      'Not taking AP Calculus BC (p-chem is heavily calculus-based)',
      'No lab experience beyond classroom (research experience is highly valued)',
      'Avoiding AP Biology (biochemistry is a major branch of chemistry)',
      'Not participating in Chemistry Olympiad when available',
    ],

    catchUpStrategies: [
      'AP Chemistry is your most critical course - prioritize it',
      'Take AP Calculus BC for physical chemistry preparation',
      'Prepare for USNCO - even local/regional participation shows dedication',
      'Reach out to local college chemistry professors about research opportunities',
      'Join Science Olympiad and focus on chemistry events',
    ],
  },

  {
    major: 'History',
    alternateNames: ['American History', 'European History', 'World History', 'Ancient History', 'Military History', 'Public History'],

    requirements: {
      minimum: ['At least one AP History course', 'AP English Language or Literature', 'Strong analytical writing'],
      competitive: [
        'Two or more AP History courses (US, World, European)',
        'AP English Language',
        'AP English Literature',
        'AP US Government or AP Comparative Government',
        'Demonstrated writing excellence',
      ],
      exceptional: [
        'All available AP History courses',
        'AP English Language AND Literature',
        'AP Government (US and/or Comparative)',
        'AP Latin or another world language',
        'Original historical research or National History Day competition',
        'Published historical writing or blog',
      ],
    },

    beyondCourses: [
      'National History Day competition projects',
      'Local history society or museum volunteering',
      'Archival research at a library or historical society',
      'Historical writing for school newspaper or independent blog',
      'Model UN for diplomatic history perspective',
      'AP World Languages for primary source access',
    ],

    admissionsOfficerPerspective:
      "History departments want critical thinkers who can analyze primary sources, construct arguments from evidence, and write persuasively. Multiple AP History courses show you can handle the reading load and analytical demands. But what truly impresses us is original research - the student who spent a summer in archives researching local history, or who won a National History Day award, demonstrates the kind of independent scholarly thinking we cultivate in our programs. Strong writing is non-negotiable; every history class requires extensive analytical essays.",

    commonMistakes: [
      'Taking only one AP History course (breadth across periods/regions matters)',
      'Weak writing skills (history IS writing at the college level)',
      'No independent reading or research beyond coursework',
      'Ignoring AP English courses (analytical essay skills are essential)',
      'Not participating in National History Day when available',
      'Thinking history is just memorizing dates (it\'s about analysis and argumentation)',
    ],

    catchUpStrategies: [
      'Take at least two AP History courses to show breadth and dedication',
      'Prioritize AP English Language for analytical writing skills',
      'Start a National History Day project - it\'s the gold standard for aspiring history majors',
      'Begin reading primary sources and writing analytical responses',
      'Volunteer at a local museum or historical society for hands-on experience',
    ],
  },

  // =========================================================================
  // HUMANITIES SUB-SPECIALIZATIONS
  // =========================================================================

  {
    major: 'English / Creative Writing',
    alternateNames: ['English Literature', 'Creative Writing', 'Rhetoric', 'Comparative Literature', 'Technical Writing'],

    requirements: {
      minimum: ['AP English Language or AP English Literature', 'Demonstrated writing portfolio'],
      competitive: [
        'AP English Language',
        'AP English Literature',
        'At least one AP History course',
        'Published writing or creative work',
        'Literary magazine or writing club involvement',
      ],
      exceptional: [
        'AP English Language AND Literature',
        'Multiple AP History courses',
        'AP World Language',
        'Scholastic Art & Writing Awards recognition',
        'Published creative writing (literary journals, contests)',
        'Original manuscript or portfolio',
      ],
    },

    beyondCourses: [
      'Scholastic Art & Writing Awards submissions',
      'School literary magazine editing or founding',
      'Creative writing workshops or summer programs (e.g., Iowa Young Writers)',
      'Personal blog or published work in literary journals',
      'Tutoring or teaching writing to younger students',
      'Extensive reading log with analytical responses',
    ],

    admissionsOfficerPerspective:
      "We want to see a student who lives and breathes the written word. Both AP English courses are expected - Language for analytical precision and Literature for interpretive depth. But what matters most is the writing portfolio. The student who edits the literary magazine, wins Scholastic Art & Writing Awards, or has published work shows a commitment to craft that goes beyond classroom achievement. Reading breadth also matters - your personal statement should reveal someone who reads voraciously and critically.",

    commonMistakes: [
      'Taking only one AP English course (both are expected for serious applicants)',
      'No writing portfolio or published work outside of class',
      'Not reading widely beyond assigned texts',
      'Ignoring AP History courses (literary analysis draws on historical context)',
      'No involvement with school literary magazine or writing community',
    ],

    catchUpStrategies: [
      'Take both AP English Language and AP English Literature',
      'Submit work to Scholastic Art & Writing Awards',
      'Join or start a school literary magazine',
      'Begin building a writing portfolio with diverse genres',
      'Apply to competitive summer writing programs',
    ],
  },

  {
    major: 'Mathematics',
    alternateNames: ['Pure Mathematics', 'Applied Math', 'Mathematical Sciences', 'Math Education'],

    requirements: {
      minimum: ['AP Calculus BC', 'Demonstrated mathematical aptitude beyond standard curriculum'],
      competitive: [
        'AP Calculus BC (with 5)',
        'AP Statistics',
        'AP Physics C: Mechanics',
        'AMC/AIME competition participation',
        'Self-study beyond BC (linear algebra, multivariable calculus)',
      ],
      exceptional: [
        'AP Calculus BC (with 5)',
        'AP Statistics',
        'AP Physics C: Mechanics and E&M',
        'AP Computer Science A',
        'AIME qualifier or USAMO participant',
        'College-level mathematics coursework (linear algebra, real analysis)',
        'Mathematical research or proofs portfolio',
      ],
    },

    beyondCourses: [
      'AMC 10/12 and AIME competitions',
      'MATHCOUNTS mentoring',
      'Math circle or math olympiad training',
      'Self-study of linear algebra, abstract algebra, or real analysis',
      'Summer math programs (PROMYS, HCSSiM, SUMaC, Ross)',
      'Mathematical modeling competitions (HiMCM, M3 Challenge)',
    ],

    admissionsOfficerPerspective:
      "For a math major at a top program, AP Calculus BC with a 5 is just the starting point - it's expected, not impressive. What separates strong applicants is what they do BEYOND the AP curriculum. AIME qualification, college-level coursework, summer math programs (Ross, PROMYS, SUMaC) - these show mathematical maturity. We want students who find proofs beautiful and enjoy the struggle of hard problems, not just students who are fast at computation. A student who can discuss mathematical ideas deeply in their essays stands out enormously.",

    commonMistakes: [
      'Thinking a 5 on AP Calculus BC is sufficient to stand out (it is expected, not differentiating)',
      'Only focusing on computation without developing proof-writing skills',
      'Not participating in math competitions (AMC, AIME are standard for math applicants)',
      'Not pursuing math beyond BC (linear algebra, multivariable should be started in high school)',
      'Avoiding AP Computer Science (computational math is increasingly important)',
    ],

    catchUpStrategies: [
      'Take AP Calculus BC and aim for a 5',
      'Start preparing for AMC 10/12 - competition math develops problem-solving skills',
      'Begin self-studying linear algebra through MIT OCW or similar',
      'Apply to a competitive summer math program (PROMYS, Ross, SUMaC)',
      'Learn Python for mathematical computation and visualization',
    ],
  },

  {
    major: 'Linguistics',
    alternateNames: ['Computational Linguistics', 'Applied Linguistics', 'Language Science', 'Cognitive Science of Language'],

    requirements: {
      minimum: ['AP World Language (any)', 'Strong analytical and pattern-recognition skills'],
      competitive: [
        'AP World Language with high score',
        'AP English Language',
        'AP Psychology',
        'Multiple language study or exposure',
        'AP Computer Science Principles',
      ],
      exceptional: [
        'Multiple AP World Languages',
        'AP English Language',
        'AP Psychology',
        'AP Computer Science A',
        'AP Statistics',
        'Linguistics Olympiad participation',
        'Independent language documentation or analysis project',
      ],
    },

    beyondCourses: [
      'NACLO (North American Computational Linguistics Open)',
      'Study of less common languages or constructed languages',
      'Language tutoring or translation volunteering',
      'Phonetics or syntax self-study (MIT OCW Intro to Linguistics)',
      'Computational linguistics projects (NLP, chatbots)',
      'Cross-cultural communication or interpreter volunteering',
    ],

    admissionsOfficerPerspective:
      "Linguistics is the scientific study of language - it's more science than humanities. We want students who see patterns in language, are fascinated by how communication works, and can think analytically about something most people take for granted. Multiple language exposure is helpful but not required - what matters more is analytical aptitude. NACLO participation is the gold standard. Students who've done computational linguistics or NLP projects show the interdisciplinary thinking our field demands. AP Computer Science and AP Psychology both connect strongly to modern linguistics.",

    commonMistakes: [
      'Thinking linguistics is just about learning many languages (it is the science of language)',
      'No analytical evidence (linguistics requires formal logic and pattern analysis)',
      'Ignoring the computational side (NLP is the largest employment area)',
      'Not knowing what linguistics actually IS before applying',
      'Skipping AP Psychology (psycholinguistics is a major subfield)',
    ],

    catchUpStrategies: [
      'Participate in NACLO - it is the single best way to demonstrate linguistics aptitude',
      'Take AP Psychology for cognitive science foundation',
      'Start learning a typologically different language (e.g., if you know Spanish, try Japanese)',
      'Explore MIT OCW Introduction to Linguistics for field exposure',
      'Try a small NLP project using Python (even simple ones demonstrate interest)',
    ],
  },

  {
    major: 'Music',
    alternateNames: ['Music Performance', 'Music Composition', 'Music Education', 'Music Technology', 'Jazz Studies'],

    requirements: {
      minimum: ['AP Music Theory', 'Years of instrument/voice training', 'Performance or composition portfolio'],
      competitive: [
        'AP Music Theory (4 or 5)',
        'Extensive private instruction (5+ years)',
        'Regional or state ensemble membership',
        'Multiple performance or composition credits',
      ],
      exceptional: [
        'AP Music Theory (5)',
        'All-State or national ensemble selection',
        'Solo competition wins at state/national level',
        'Original compositions portfolio',
        'Summer conservatory or pre-college program attendance',
        'Cross-genre versatility',
      ],
    },

    beyondCourses: [
      'Private instruction and recital performances',
      'All-State or All-Region ensemble auditions',
      'Solo and ensemble competition at state level',
      'Original composition and arrangement',
      'Summer pre-college programs (Juilliard, Berklee, Interlochen)',
      'Church, community, or professional ensemble participation',
    ],

    admissionsOfficerPerspective:
      "Music admissions are portfolio/audition-based. AP Music Theory shows academic engagement with music, but the audition is what matters most. We want to hear technical proficiency, musical maturity, and personal voice. Students who've studied privately for years, performed in competitive ensembles, and composed their own work show the dedication this career demands. Summer pre-college programs at conservatories are strong signals. Cross-genre versatility (classical + jazz, for example) is increasingly valued.",

    commonMistakes: [
      'Relying only on school ensemble participation without private instruction',
      'Not taking AP Music Theory (it shows academic commitment to music)',
      'Waiting until senior year to prepare audition repertoire',
      'Only performing without composing or arranging (shows limited musicianship)',
      'Not attending any pre-college summer programs',
    ],

    catchUpStrategies: [
      'Start serious private instruction immediately',
      'Take AP Music Theory to build theoretical foundation',
      'Prepare audition repertoire well in advance (at least 6-12 months)',
      'Apply to summer pre-college programs at conservatories',
      'Begin composing or arranging to broaden musicianship',
    ],
  },
];

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function getCollegeTier(tier: CollegeTier): CollegeTierProfile {
  return COLLEGE_TIERS[tier];
}

export function getMajorExpectations(major: string): MajorSpecificExpectation | undefined {
  const normalized = major.toLowerCase();
  return MAJOR_EXPECTATIONS.find(
    (m) =>
      m.major.toLowerCase().includes(normalized) ||
      m.alternateNames.some((alt) => alt.toLowerCase().includes(normalized)) ||
      normalized.includes(m.major.toLowerCase())
  );
}

export function getRecommendedCoursesForMajor(major: string, tier: CollegeTier): string[] {
  const majorExp = getMajorExpectations(major);
  if (!majorExp) return [];

  const tierProfile = COLLEGE_TIERS[tier];

  // For more competitive tiers, recommend competitive/exceptional courses
  if (tier === 'ivy_elite' || tier === 'highly_selective') {
    return [...new Set([...majorExp.requirements.competitive, ...majorExp.requirements.exceptional])];
  } else if (tier === 'selective') {
    return [...new Set([...majorExp.requirements.minimum, ...majorExp.requirements.competitive])];
  } else {
    return majorExp.requirements.minimum;
  }
}

export function assessMajorReadiness(
  major: string,
  currentCourses: string[],
  tier: CollegeTier
): {
  readiness: 'on_track' | 'behind' | 'ahead';
  missing: string[];
  strengths: string[];
  advice: string;
} {
  const majorExp = getMajorExpectations(major);
  if (!majorExp) {
    return {
      readiness: 'on_track',
      missing: [],
      strengths: [],
      advice: 'Focus on courses relevant to your intended field.',
    };
  }

  const recommended = getRecommendedCoursesForMajor(major, tier);
  const courseLower = currentCourses.map((c) => c.toLowerCase());

  const missing = recommended.filter(
    (r) => !courseLower.some((c) => c.includes(r.toLowerCase()) || r.toLowerCase().includes(c))
  );

  const strengths = currentCourses.filter((c) =>
    majorExp.requirements.exceptional.some(
      (e) => c.toLowerCase().includes(e.toLowerCase()) || e.toLowerCase().includes(c.toLowerCase())
    )
  );

  let readiness: 'on_track' | 'behind' | 'ahead';
  let advice: string;

  if (missing.length === 0 && strengths.length >= 2) {
    readiness = 'ahead';
    advice = 'Your coursework strongly aligns with your intended major. Focus on depth over adding more breadth.';
  } else if (missing.length >= 3) {
    readiness = 'behind';
    advice = `You're missing several courses typically expected for ${major} applicants: ${missing.slice(0, 3).join(', ')}. Prioritize adding these.`;
  } else {
    readiness = 'on_track';
    advice =
      missing.length > 0
        ? `Consider adding ${missing[0]} to strengthen your application.`
        : 'Your course trajectory aligns with your intended major.';
  }

  return { readiness, missing, strengths, advice };
}

export function getTierBySelectivity(acceptanceRate: number): CollegeTier {
  if (acceptanceRate <= 0.10) return 'ivy_elite';
  if (acceptanceRate <= 0.25) return 'highly_selective';
  if (acceptanceRate <= 0.50) return 'selective';
  if (acceptanceRate <= 0.75) return 'competitive';
  return 'accessible';
}
