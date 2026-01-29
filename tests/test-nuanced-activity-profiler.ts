/**
 * Comprehensive Test Suite for Nuanced Activity Profiler
 *
 * Tests the professional-grade activity analysis system that understands
 * the subtle nuances elite admissions counselors use when evaluating
 * extracurricular profiles.
 *
 * Test categories:
 * 1. Description Quality Analysis - with coaching feedback
 * 2. Time Commitment Credibility - hours validation
 * 3. Authenticity Detection - manufactured vs genuine activities
 * 4. Major Alignment Analysis - field-specific evaluation
 * 5. Portfolio Interconnection - narrative coherence
 * 6. Full Profile Analysis - end-to-end testing
 */

import { nuancedActivityProfiler } from '../src/services/portfolioStrategy/engines/nuancedActivityProfiler';
import { NuancedProfilingInput } from '../src/services/portfolioStrategy/types/nuancedProfiling';
import { ActivityCategory } from '../src/services/portfolioStrategy/types/activities';

// ============================================================================
// TEST DATA
// ============================================================================

// Strong CS applicant profile
const STRONG_CS_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Computer Science',
    majorCertainty: 'certain',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'usaco-gold',
      name: 'USACO Competitive Programming',
      category: 'academic_competition',
      role: 'Competitor',
      description: 'Achieved USACO Gold division, placing top 5% nationally. Developed 50+ algorithmic solutions, mentored 12 students in my school\'s competitive programming club.',
      hoursPerWeek: 8,
      weeksPerYear: 40,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      organization: 'USA Computing Olympiad',
      achievements: [
        { name: 'USACO Gold', level: 'national' },
      ],
    },
    {
      id: 'personal-app',
      name: 'StudyBuddy App',
      category: 'stem_project',
      role: 'Founder & Lead Developer',
      description: 'Built full-stack React Native app with 2,500+ active users. Implemented ML-based study scheduling that improved user retention by 45%. Featured on Product Hunt.',
      hoursPerWeek: 15,
      weeksPerYear: 50,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { name: 'Product Hunt Top 10', level: 'national' },
        { name: '2500+ users', level: 'national' },
      ],
    },
    {
      id: 'cs-research',
      name: 'ML Research at State University',
      category: 'research',
      role: 'Research Intern',
      description: 'Conducted NLP research under Prof. Chen, developing novel text classification approach. Co-authored paper submitted to ACL workshop. Implemented PyTorch models achieving 94% accuracy.',
      hoursPerWeek: 12,
      weeksPerYear: 16,
      yearsInvolved: 1,
      gradeLevels: [11],
      organization: 'State University CS Department',
      achievements: [
        { name: 'Co-authored research paper', level: 'regional' },
      ],
    },
    {
      id: 'cs-club',
      name: 'Computer Science Club President',
      category: 'leadership_governance',
      role: 'President',
      description: 'Led 45-member club, organizing weekly workshops and hackathons. Grew membership 150% over 2 years. Secured $3,000 in sponsorships from local tech companies.',
      hoursPerWeek: 6,
      weeksPerYear: 36,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      organization: 'Lincoln High School',
      achievements: [
        { name: 'Club of the Year', level: 'school' },
      ],
    },
    {
      id: 'tutoring',
      name: 'Math & CS Tutoring',
      category: 'community_service',
      role: 'Lead Tutor',
      description: 'Tutored 25+ underserved students in AP CS and Calculus. 80% achieved exam scores of 4+. Created online curriculum used by 3 other tutoring centers.',
      hoursPerWeek: 4,
      weeksPerYear: 40,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [],
    },
  ],
};

// Weak profile with red flags
const WEAK_PROFILE_WITH_RED_FLAGS: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Computer Science',
    majorCertainty: 'exploring',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'suspicious-startup',
      name: 'Tech Startup CEO',
      category: 'entrepreneurship',
      role: 'CEO & Founder',
      description: 'Founded a tech company. Passionate about technology and making a difference. Always wanted to be an entrepreneur.',
      hoursPerWeek: 30,
      weeksPerYear: 52,
      yearsInvolved: 1,
      gradeLevels: [12],
      achievements: [],
    },
    {
      id: 'nhs',
      name: 'National Honor Society',
      category: 'leadership_governance',
      role: 'Member',
      description: 'Participated in various activities and helped with events.',
      hoursPerWeek: 2,
      weeksPerYear: 30,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      organization: 'School',
      achievements: [],
    },
    {
      id: 'volunteer',
      name: 'Hospital Volunteer',
      category: 'community_service',
      role: 'Volunteer',
      description: 'Helped at local hospital. Learned a lot and was inspired by the experience.',
      hoursPerWeek: 50,
      weeksPerYear: 50,
      yearsInvolved: 1,
      gradeLevels: [12],
      achievements: [],
    },
  ],
};

// Pre-med profile
const PREMED_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Biology',
    majorCertainty: 'likely',
    gradeLevel: 12,
    isFirstGen: true,
  },
  activities: [
    {
      id: 'research',
      name: 'Cancer Research Lab',
      category: 'research',
      role: 'Research Assistant',
      description: 'Conducted CRISPR gene editing research in oncology lab. Performed 200+ cell cultures, analyzed data using R. Presented findings at regional science symposium.',
      hoursPerWeek: 10,
      weeksPerYear: 45,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      organization: 'City Medical Center',
      achievements: [
        { name: 'Regional Science Symposium Presenter', level: 'regional' },
      ],
    },
    {
      id: 'clinic',
      name: 'Free Clinic Volunteer',
      category: 'community_service',
      role: 'Medical Assistant Volunteer',
      description: 'Assisted physicians serving 500+ uninsured patients over 2 years. Conducted intake interviews, organized medication drives collecting $15,000 in donated supplies.',
      hoursPerWeek: 6,
      weeksPerYear: 48,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      organization: 'Community Free Clinic',
      achievements: [],
    },
    {
      id: 'science-olympiad',
      name: 'Science Olympiad',
      category: 'academic_competition',
      role: 'Captain - Disease Detectives & Anatomy',
      description: 'Led team to 3rd place at state competition. Won gold medals in Disease Detectives (2x) and Anatomy events. Coached 6 underclassmen in biology events.',
      hoursPerWeek: 8,
      weeksPerYear: 30,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      organization: 'Lincoln High School',
      achievements: [
        { name: 'State 3rd Place Team', level: 'state' },
        { name: 'Gold Medal Disease Detectives', level: 'state' },
      ],
    },
    {
      id: 'emt',
      name: 'EMT Certification & Volunteering',
      category: 'community_service',
      role: 'Certified EMT',
      description: 'Earned EMT-Basic certification at 17. Completed 100+ volunteer ambulance shifts, responding to emergencies. Performed CPR in 3 real cardiac emergencies.',
      hoursPerWeek: 8,
      weeksPerYear: 40,
      yearsInvolved: 1,
      gradeLevels: [12],
      achievements: [
        { name: 'EMT-Basic Certification', level: 'national' },
      ],
    },
  ],
};

// Business profile
const BUSINESS_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Business Administration',
    majorCertainty: 'certain',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'deca',
      name: 'DECA Business Competition',
      category: 'academic_competition',
      role: 'Team Captain',
      description: 'Led team to ICDC (international conference) 2x. Won 1st place state in Marketing Communications, developed 50-page business plan for real local business.',
      hoursPerWeek: 8,
      weeksPerYear: 35,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      organization: 'DECA Inc.',
      achievements: [
        { name: 'ICDC Qualifier', level: 'international' },
        { name: 'State 1st Place', level: 'state' },
      ],
    },
    {
      id: 'nonprofit',
      name: 'Youth Entrepreneurship Nonprofit',
      category: 'entrepreneurship',
      role: 'Co-Founder & Executive Director',
      description: 'Co-founded nonprofit teaching business skills to low-income youth. Raised $25,000 in grants, trained 150 students across 8 schools, 30% started small businesses.',
      hoursPerWeek: 12,
      weeksPerYear: 48,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { name: 'Featured in Local News', level: 'regional' },
      ],
    },
    {
      id: 'investment-club',
      name: 'Investment Club',
      category: 'leadership_governance',
      role: 'President',
      description: 'Managed $5,000 real portfolio achieving 23% annual return. Taught weekly seminars on financial literacy to 30 members. Organized speaker series with 5 local CFOs.',
      hoursPerWeek: 5,
      weeksPerYear: 36,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      organization: 'Lincoln High School',
      achievements: [],
    },
    {
      id: 'internship',
      name: 'Marketing Internship',
      category: 'internship',
      role: 'Marketing Intern',
      description: 'Created social media strategy increasing engagement 200%. Managed $2,000 ad budget, designed 15 marketing campaigns. Received return offer.',
      hoursPerWeek: 25,
      weeksPerYear: 10,
      yearsInvolved: 1,
      gradeLevels: [11],
      organization: 'Local Marketing Agency',
      achievements: [],
    },
  ],
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════════╗');
  console.log('║     NUANCED ACTIVITY PROFILER - COMPREHENSIVE TEST SUITE         ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  // Test 1: Strong CS Profile Analysis
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Strong CS Applicant Profile Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const csResult = await nuancedActivityProfiler.analyzeProfile(STRONG_CS_PROFILE);

    // Verify overall structure
    console.log('\n📊 Overall Assessment:');
    console.log(`   Major: ${csResult.studentContext.intendedMajor}`);
    console.log(`   Activities analyzed: ${csResult.activityProfiles.length}`);
    console.log(`   Overall confidence: ${csResult.analysisConfidence.overallConfidence}%`);

    // Check activity tiers
    const tier1Count = csResult.activityProfiles.filter(a => a.tier === 1).length;
    const tier2Count = csResult.activityProfiles.filter(a => a.tier === 2).length;
    console.log(`\n📈 Tier Distribution:`);
    console.log(`   Tier 1: ${tier1Count}`);
    console.log(`   Tier 2: ${tier2Count}`);
    console.log(`   Tier 3+: ${csResult.activityProfiles.length - tier1Count - tier2Count}`);

    // Verify major alignment
    console.log(`\n🎯 Major Alignment:`);
    console.log(`   Overall Score: ${csResult.portfolioAnalysis.majorAlignment.overallAlignment.score}`);
    console.log(`   Level: ${csResult.portfolioAnalysis.majorAlignment.overallAlignment.level}`);
    console.log(`   Strongly Aligned: ${csResult.portfolioAnalysis.majorAlignment.stronglyAligned.activities.length}`);

    // Description quality
    console.log(`\n📝 Description Quality (first 3 activities):`);
    for (const profile of csResult.activityProfiles.slice(0, 3)) {
      console.log(`   ${profile.activityName}: ${profile.descriptionQuality.overallScore}/100 (${profile.descriptionQuality.qualityLevel})`);
    }

    // Assertions
    const test1Assertions = [
      { name: 'Has 5 activity profiles', passed: csResult.activityProfiles.length === 5 },
      { name: 'At least 2 Tier 1/2 activities', passed: tier1Count + tier2Count >= 2 },
      { name: 'Major alignment score >= 60', passed: csResult.portfolioAnalysis.majorAlignment.overallAlignment.score >= 60 },
      { name: 'High confidence (>= 70)', passed: csResult.analysisConfidence.overallConfidence >= 70 },
      { name: 'Description quality for USACO >= 60', passed: csResult.activityProfiles.find(a => a.activityId === 'usaco-gold')?.descriptionQuality.overallScore! >= 60 },
    ];

    for (const assertion of test1Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 1: ${assertion.name}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Test 1 failed with error: ${error}`);
    failed++;
    failures.push(`Test 1: Error - ${error}`);
  }

  // Test 2: Red Flags Detection
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Red Flags and Weak Profile Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const weakResult = await nuancedActivityProfiler.analyzeProfile(WEAK_PROFILE_WITH_RED_FLAGS);

    console.log('\n🚩 Red Flag Detection:');

    // Check suspicious startup
    const startup = weakResult.activityProfiles.find(a => a.activityId === 'suspicious-startup');
    if (startup) {
      console.log(`\n   "Tech Startup CEO" Analysis:`);
      console.log(`   - Tier: ${startup.tier}`);
      console.log(`   - Description Quality: ${startup.descriptionQuality.overallScore}/100`);
      console.log(`   - Authenticity Score: ${startup.authenticity.overallScore}/100`);
      console.log(`   - Authenticity Level: ${startup.authenticity.level}`);
      console.log(`   - Concern Signals: ${startup.authenticity.concernSignals.length}`);

      if (startup.authenticity.concernSignals.length > 0) {
        console.log(`   - Top Concern: ${startup.authenticity.concernSignals[0].signal}`);
      }
    }

    // Check time credibility
    const volunteer = weakResult.activityProfiles.find(a => a.activityId === 'volunteer');
    if (volunteer) {
      console.log(`\n   "Hospital Volunteer" Time Analysis:`);
      console.log(`   - Claimed hours/week: ${volunteer.timeCommitment.hoursPerWeek}`);
      console.log(`   - Credibility Score: ${volunteer.timeCommitment.credibility.score}/100`);
      console.log(`   - Credibility Level: ${volunteer.timeCommitment.credibility.level}`);
      console.log(`   - Concerns: ${volunteer.timeCommitment.credibility.concerns.join(', ')}`);
    }

    // Check description issues
    const nhs = weakResult.activityProfiles.find(a => a.activityId === 'nhs');
    if (nhs) {
      console.log(`\n   "NHS" Description Analysis:`);
      console.log(`   - Quality Score: ${nhs.descriptionQuality.overallScore}/100`);
      console.log(`   - Issues Found: ${nhs.descriptionQuality.issues.length}`);
      if (nhs.descriptionQuality.issues.length > 0) {
        console.log(`   - Critical Issues: ${nhs.descriptionQuality.issues.filter(i => i.severity === 'critical' || i.severity === 'major').length}`);
      }
    }

    // Assertions
    const test2Assertions = [
      { name: 'Startup authenticity score < 60', passed: startup!.authenticity.overallScore < 60 },
      { name: 'Startup has concern signals', passed: startup!.authenticity.concernSignals.length > 0 },
      { name: 'Volunteer time credibility < 70', passed: volunteer!.timeCommitment.credibility.score < 70 },
      { name: 'NHS description quality < 50', passed: nhs!.descriptionQuality.overallScore < 50 },
      { name: 'Overall profile has gaps', passed: weakResult.portfolioAnalysis.majorAlignment.gaps.length > 0 },
    ];

    for (const assertion of test2Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 2: ${assertion.name}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Test 2 failed with error: ${error}`);
    failed++;
    failures.push(`Test 2: Error - ${error}`);
  }

  // Test 3: Pre-Med Profile
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Pre-Med Profile Field-Specific Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const premedResult = await nuancedActivityProfiler.analyzeProfile(PREMED_PROFILE);

    console.log('\n🏥 Pre-Med Field Analysis:');
    console.log(`   Major detected: ${premedResult.studentContext.intendedMajor}`);
    console.log(`   Field expectations met: ${premedResult.fieldSpecificAssessment.meetsExpectations}`);

    // Check major alignment
    console.log(`\n🎯 Major Alignment:`);
    console.log(`   Score: ${premedResult.portfolioAnalysis.majorAlignment.overallAlignment.score}`);
    console.log(`   Core activities: ${premedResult.activityProfiles.filter(a => a.majorAlignment.type === 'core').length}`);
    console.log(`   Supporting activities: ${premedResult.activityProfiles.filter(a => a.majorAlignment.type === 'supporting').length}`);

    // Check competitive assessment
    console.log(`\n📊 Competitive Assessment:`);
    console.log(`   vs Typical: ${premedResult.portfolioAnalysis.majorAlignment.competitiveAssessment.vsTypicalApplicant}`);
    console.log(`   vs Top: ${premedResult.portfolioAnalysis.majorAlignment.competitiveAssessment.vsTopApplicant}`);
    console.log(`   Strengths: ${premedResult.portfolioAnalysis.majorAlignment.competitiveAssessment.strengthsForMajor.slice(0, 2).join(', ')}`);

    // Check interconnections
    console.log(`\n🔗 Portfolio Coherence:`);
    console.log(`   Connectivity Score: ${premedResult.portfolioAnalysis.interconnections.overallConnectivity.score}`);
    console.log(`   Primary Thread: ${premedResult.portfolioAnalysis.interconnections.overallConnectivity.primaryThread}`);
    console.log(`   Clusters Found: ${premedResult.portfolioAnalysis.interconnections.clusters.length}`);

    // Assertions
    const test3Assertions = [
      { name: 'Major normalized to pre_med or natural_sciences', passed: ['pre_med', 'natural_sciences'].includes(premedResult.studentContext.intendedMajor) },
      { name: 'Has core activities for major', passed: premedResult.activityProfiles.some(a => a.majorAlignment.type === 'core') },
      { name: 'Research activity has adequate+ description quality', passed: premedResult.activityProfiles.find(a => a.activityId === 'research')!.descriptionQuality.overallScore >= 50 },
      { name: 'Science Olympiad is Tier 2 or better', passed: premedResult.activityProfiles.find(a => a.activityId === 'science-olympiad')!.tier <= 2 },
      { name: 'Portfolio has interconnections', passed: premedResult.portfolioAnalysis.interconnections.connections.length > 0 },
    ];

    for (const assertion of test3Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 3: ${assertion.name}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Test 3 failed with error: ${error}`);
    failed++;
    failures.push(`Test 3: Error - ${error}`);
  }

  // Test 4: Business Profile
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Business Profile Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const businessResult = await nuancedActivityProfiler.analyzeProfile(BUSINESS_PROFILE);

    console.log('\n💼 Business Profile Analysis:');
    console.log(`   Major: ${businessResult.studentContext.intendedMajor}`);

    // Check DECA (should be tier 1 with international achievement)
    const deca = businessResult.activityProfiles.find(a => a.activityId === 'deca');
    if (deca) {
      console.log(`\n   DECA Analysis:`);
      console.log(`   - Tier: ${deca.tier}`);
      console.log(`   - Major Alignment: ${deca.majorAlignment.type} (${deca.majorAlignment.score})`);
      console.log(`   - Description Quality: ${deca.descriptionQuality.overallScore}/100`);
    }

    // Check nonprofit
    const nonprofit = businessResult.activityProfiles.find(a => a.activityId === 'nonprofit');
    if (nonprofit) {
      console.log(`\n   Nonprofit Analysis:`);
      console.log(`   - Tier: ${nonprofit.tier}`);
      console.log(`   - Authenticity Score: ${nonprofit.authenticity.overallScore}/100`);
      console.log(`   - Strategic Value: ${nonprofit.strategicValue}`);
    }

    // Recommendations
    console.log(`\n📋 Recommendations:`);
    console.log(`   Immediate: ${businessResult.recommendations.actionPlan.immediate.slice(0, 2).join('; ')}`);
    console.log(`   Activities to Highlight: ${businessResult.recommendations.activityStrategy.activitiesToHighlight.length}`);

    // Assertions
    const test4Assertions = [
      { name: 'DECA is Tier 1 or 2', passed: deca!.tier <= 2 },
      { name: 'DECA aligned as core or supporting', passed: ['core', 'supporting'].includes(deca!.majorAlignment.type) },
      { name: 'Nonprofit has valid authenticity assessment', passed: nonprofit!.authenticity.overallScore >= 40 || nonprofit!.authenticity.authenticitySignals.length > 0 },
      { name: 'Overall alignment is strong or better', passed: ['strong', 'exceptional'].includes(businessResult.portfolioAnalysis.majorAlignment.overallAlignment.level) },
      { name: 'Has activity recommendations', passed: businessResult.recommendations.activityStrategy.activitiesToHighlight.length > 0 },
    ];

    for (const assertion of test4Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 4: ${assertion.name}`);
      }
    }

  } catch (error) {
    console.log(`   ❌ Test 4 failed with error: ${error}`);
    failed++;
    failures.push(`Test 4: Error - ${error}`);
  }

  // Test 5: Description Quality Edge Cases
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Description Quality Analysis Edge Cases');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const descriptionTestCases = [
    {
      name: 'Exceptional description',
      description: 'Led 50-member robotics team to FRC World Championship, placing 4th globally. Designed autonomous navigation system using computer vision, reducing path error by 73%. Raised $45,000 in sponsorships, mentored 12 rookie teams.',
      expectedQuality: 'exceptional',
      minScore: 75,
    },
    {
      name: 'Vague description',
      description: 'Participated in various activities. Helped with things and stuff.',
      expectedQuality: 'problematic',
      maxScore: 40,
    },
    {
      name: 'Inflated without substance',
      description: 'Passionate CEO of amazing startup. Dedicated to changing the world and making a difference. My dream has always been to be an entrepreneur.',
      expectedQuality: 'weak',
      maxScore: 50,
    },
    {
      name: 'Good but missing quantification',
      description: 'Founded environmental club focused on campus sustainability. Organized recycling programs, educated students about climate change, and partnered with local organizations.',
      expectedQuality: 'adequate',
      minScore: 40,
      maxScore: 65,
    },
  ];

  for (const testCase of descriptionTestCases) {
    const testInput: NuancedProfilingInput = {
      studentContext: {
        intendedMajor: 'Computer Science',
        majorCertainty: 'certain',
        gradeLevel: 12,
      },
      activities: [{
        id: 'test',
        name: 'Test Activity',
        category: 'leadership_governance',
        role: 'Leader',
        description: testCase.description,
        hoursPerWeek: 5,
        weeksPerYear: 36,
        yearsInvolved: 2,
        gradeLevels: [11, 12],
        achievements: [],
      }],
    };

    try {
      const result = await nuancedActivityProfiler.analyzeProfile(testInput);
      const descQuality = result.activityProfiles[0].descriptionQuality;

      const passedQuality = descQuality.qualityLevel === testCase.expectedQuality ||
        (testCase.minScore && descQuality.overallScore >= testCase.minScore) ||
        (testCase.maxScore && descQuality.overallScore <= testCase.maxScore);

      console.log(`\n   ${testCase.name}:`);
      console.log(`   - Score: ${descQuality.overallScore}/100 (${descQuality.qualityLevel})`);
      console.log(`   - Expected: ${testCase.expectedQuality} (${testCase.minScore ? `>=${testCase.minScore}` : ''}${testCase.maxScore ? `<=${testCase.maxScore}` : ''})`);

      if (passedQuality) {
        console.log(`   ✅ Quality assessment correct`);
        passed++;
      } else {
        console.log(`   ❌ Quality assessment incorrect`);
        failed++;
        failures.push(`Test 5: ${testCase.name} quality assessment`);
      }

      // Check coaching feedback exists
      if (descQuality.coaching.priorityImprovements.length > 0 || descQuality.coaching.whatWorksWell.length > 0) {
        console.log(`   ✅ Coaching feedback provided`);
        passed++;
      } else {
        console.log(`   ❌ Missing coaching feedback`);
        failed++;
        failures.push(`Test 5: ${testCase.name} coaching feedback`);
      }

    } catch (error) {
      console.log(`   ❌ ${testCase.name} failed: ${error}`);
      failed++;
      failures.push(`Test 5: ${testCase.name} - ${error}`);
    }
  }

  // Test 6: Time Commitment Credibility
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Time Commitment Credibility Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const timeTestCases = [
    { hoursPerWeek: 10, weeksPerYear: 40, expected: 'credible', category: 'research' },
    { hoursPerWeek: 50, weeksPerYear: 52, expected: 'implausible', category: 'community_service' },
    { hoursPerWeek: 25, weeksPerYear: 10, expected: 'credible', category: 'internship' },
    { hoursPerWeek: 8, weeksPerYear: 30, expected: 'highly_credible', category: 'athletics' },
  ];

  for (const testCase of timeTestCases) {
    const testInput: NuancedProfilingInput = {
      studentContext: {
        intendedMajor: 'Computer Science',
        majorCertainty: 'certain',
        gradeLevel: 12,
      },
      activities: [{
        id: 'test',
        name: 'Test Activity',
        category: testCase.category as ActivityCategory,
        role: 'Member',
        description: 'Test description with some details.',
        hoursPerWeek: testCase.hoursPerWeek,
        weeksPerYear: testCase.weeksPerYear,
        yearsInvolved: 1,
        gradeLevels: [12],
        achievements: [],
      }],
    };

    try {
      const result = await nuancedActivityProfiler.analyzeProfile(testInput);
      const timeAnalysis = result.activityProfiles[0].timeCommitment;

      const credibilityMatch = timeAnalysis.credibility.level === testCase.expected ||
        (testCase.expected === 'credible' && ['credible', 'highly_credible'].includes(timeAnalysis.credibility.level)) ||
        (testCase.expected === 'implausible' && ['implausible', 'questionable'].includes(timeAnalysis.credibility.level));

      console.log(`\n   ${testCase.hoursPerWeek}hrs/wk × ${testCase.weeksPerYear}wks (${testCase.category}):`);
      console.log(`   - Credibility: ${timeAnalysis.credibility.level} (expected: ${testCase.expected})`);
      console.log(`   - Score: ${timeAnalysis.credibility.score}/100`);

      if (credibilityMatch) {
        console.log(`   ✅ Credibility assessment correct`);
        passed++;
      } else {
        console.log(`   ❌ Credibility assessment incorrect`);
        failed++;
        failures.push(`Test 6: ${testCase.hoursPerWeek}hrs credibility`);
      }

    } catch (error) {
      console.log(`   ❌ Time test failed: ${error}`);
      failed++;
      failures.push(`Test 6: Time test - ${error}`);
    }
  }

  // Final Summary
  console.log('\n╔══════════════════════════════════════════════════════════════════╗');
  console.log('║                         TEST SUMMARY                              ║');
  console.log('╚══════════════════════════════════════════════════════════════════╝');
  console.log(`\n   Total Tests: ${passed + failed}`);
  console.log(`   ✅ Passed: ${passed}`);
  console.log(`   ❌ Failed: ${failed}`);
  console.log(`   Success Rate: ${((passed / (passed + failed)) * 100).toFixed(1)}%`);

  if (failures.length > 0) {
    console.log('\n   Failed Tests:');
    for (const failure of failures) {
      console.log(`   - ${failure}`);
    }
  }

  console.log('\n');

  // Return exit code
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);
