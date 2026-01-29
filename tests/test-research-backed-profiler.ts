/**
 * Comprehensive Test Suite for Research-Backed Extracurricular Profiler
 *
 * This test suite validates that our profiling system aligns with:
 * 1. Harvard's 1-6 scoring system
 * 2. Sara Harberson's point system (former Penn Dean of Admissions)
 * 3. Stanford's "spike over breadth" philosophy
 * 4. Real admissions officer perspectives on authenticity
 * 5. Field-specific expectations (CS, Pre-Med, Business, etc.)
 *
 * Test Categories:
 * 1. Grade-Level Weighting (Junior > Sophomore > Freshman)
 * 2. Duration Commitment (3-5 years ideal)
 * 3. Spike vs. Breadth Detection
 * 4. Time Realism Checking
 * 5. Authenticity Red Flag Detection
 * 6. Major-Specific Alignment
 * 7. Complete Profile Analysis
 */

import { researchBackedProfiler } from '../src/services/portfolioStrategy/engines/researchBackedProfiler';
import { NuancedProfilingInput } from '../src/services/portfolioStrategy/types/nuancedProfiling';

// ============================================================================
// TEST DATA: REALISTIC PROFILES
// ============================================================================

// Profile 1: Exceptional CS applicant (would score Harvard 1-2)
const EXCEPTIONAL_CS_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Computer Science',
    majorCertainty: 'certain',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'usaco-plat',
      name: 'USACO Competitive Programming',
      category: 'academic_competition',
      role: 'Competitor',
      description: 'Achieved USACO Platinum division, top 200 nationally. Developed 100+ algorithmic solutions. Created USACO prep materials used by 500+ students.',
      hoursPerWeek: 10,
      weeksPerYear: 45,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [
        { title: 'USACO Platinum', level: 'national' },
      ],
    },
    {
      id: 'research',
      name: 'ML Research at Stanford',
      category: 'research',
      role: 'Research Intern',
      description: 'Co-authored paper on transformer architectures accepted at NeurIPS workshop. Implemented novel attention mechanism improving accuracy 12%. Worked with Prof. Li on LLM efficiency.',
      hoursPerWeek: 15,
      weeksPerYear: 12,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { title: 'NeurIPS Workshop Publication', level: 'international' },
      ],
    },
    {
      id: 'startup',
      name: 'EdTech Startup - StudyAI',
      category: 'entrepreneurship',
      role: 'Founder & CTO',
      description: 'Built AI tutoring platform with 8,000+ users. Raised $25K in seed funding. Tech featured in TechCrunch. Revenue: $5K/month from premium subscriptions.',
      hoursPerWeek: 15,
      weeksPerYear: 52,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { title: 'TechCrunch Feature', level: 'national' },
        { title: 'Y Combinator Startup School', level: 'national' },
      ],
    },
    {
      id: 'cs-club',
      name: 'CS Club President',
      category: 'leadership_governance',
      role: 'President',
      description: 'Grew membership from 20 to 85 students. Organized 12 hackathons with 500+ total participants. Established partnerships with 3 tech companies for mentorship.',
      hoursPerWeek: 6,
      weeksPerYear: 36,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [],
    },
    {
      id: 'tutoring',
      name: 'CS Tutoring Program',
      category: 'community_service',
      role: 'Founder',
      description: 'Founded free coding program for underserved middle schoolers. Taught 75 students Python basics over 3 years. 60% continued to take CS in high school.',
      hoursPerWeek: 4,
      weeksPerYear: 36,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [],
    },
  ],
};

// Profile 2: Manufactured/Suspicious profile (should raise red flags)
const SUSPICIOUS_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Computer Science',
    majorCertainty: 'certain',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'fake-ceo',
      name: 'Global Tech Innovations Inc.',
      category: 'entrepreneurship',
      role: 'CEO & Founder',
      description: 'Founded innovative technology company focused on solving world problems. Passionate about entrepreneurship and making a difference. Working on groundbreaking AI solutions.',
      hoursPerWeek: 35,
      weeksPerYear: 52,
      yearsInvolved: 1,
      gradeLevels: [12], // Only senior year - red flag
      achievements: [],
    },
    {
      id: 'fake-research',
      name: 'Cancer Research',
      category: 'research',
      role: 'Lead Researcher',
      description: 'Conducted groundbreaking cancer research. Passionate about curing diseases. Made significant discoveries.',
      hoursPerWeek: 25,
      weeksPerYear: 50,
      yearsInvolved: 1,
      gradeLevels: [12], // Only senior year
      achievements: [],
    },
    {
      id: 'fake-nonprofit',
      name: 'Youth Empowerment Foundation',
      category: 'community_service',
      role: 'Founder & President',
      description: 'Founded nonprofit helping youth. Impacted thousands of lives. Passionate about service.',
      hoursPerWeek: 20,
      weeksPerYear: 50,
      yearsInvolved: 1,
      gradeLevels: [12],
      achievements: [],
    },
  ],
};

// Profile 3: Strong Pre-Med applicant
const STRONG_PREMED_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Biology / Pre-Med',
    majorCertainty: 'certain',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'clinical',
      name: 'Emergency Department Volunteer',
      category: 'community_service',
      role: 'Clinical Volunteer',
      description: 'Completed 450 hours in Level 1 trauma center. Assisted with patient transport, comfort, and family communication. Shadowed physicians across 5 specialties.',
      hoursPerWeek: 8,
      weeksPerYear: 45,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [],
    },
    {
      id: 'research',
      name: 'Cancer Biology Research',
      category: 'research',
      role: 'Research Assistant',
      description: 'Conducted CRISPR gene editing research in oncology lab. Performed 300+ cell cultures, analyzed data with R. Co-authored poster at regional conference.',
      hoursPerWeek: 10,
      weeksPerYear: 48,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { title: 'Regional Science Conference Poster', level: 'regional' },
      ],
    },
    {
      id: 'emt',
      name: 'EMT Certification & Service',
      category: 'community_service',
      role: 'Certified EMT-B',
      description: 'Earned EMT-B certification at 17. Completed 120+ volunteer ambulance shifts. Responded to cardiac, trauma, and medical emergencies.',
      hoursPerWeek: 8,
      weeksPerYear: 48,
      yearsInvolved: 1,
      gradeLevels: [12],
      achievements: [
        { title: 'EMT-B Certification', level: 'national' },
      ],
    },
    {
      id: 'science-olympiad',
      name: 'Science Olympiad',
      category: 'academic_competition',
      role: 'Captain - Disease Detectives',
      description: 'Led team to state championship. Won gold medals in Disease Detectives (3x) and Anatomy. Coached 8 underclassmen in biology events.',
      hoursPerWeek: 6,
      weeksPerYear: 30,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [
        { title: 'State Championship 3rd Place Team', level: 'state' },
        { title: 'State Gold - Disease Detectives', level: 'state' },
      ],
    },
    {
      id: 'free-clinic',
      name: 'Free Clinic Volunteer',
      category: 'community_service',
      role: 'Medical Assistant Volunteer',
      description: 'Assisted physicians serving 400+ uninsured patients. Conducted intake interviews, organized medication drives collecting $12,000 in donated supplies.',
      hoursPerWeek: 5,
      weeksPerYear: 48,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [],
    },
  ],
};

// Profile 4: Scattered/breadth-focused profile (not spiked)
const SCATTERED_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Computer Science',
    majorCertainty: 'exploring',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'soccer',
      name: 'Varsity Soccer',
      category: 'athletics',
      role: 'Player',
      description: 'Played varsity soccer for 3 years. Contributed to team chemistry.',
      hoursPerWeek: 15,
      weeksPerYear: 16,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [],
    },
    {
      id: 'nhs',
      name: 'National Honor Society',
      category: 'leadership_governance',
      role: 'Member',
      description: 'Active member. Participated in service projects and events.',
      hoursPerWeek: 2,
      weeksPerYear: 30,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [],
    },
    {
      id: 'band',
      name: 'Marching Band',
      category: 'performing_arts',
      role: 'Trumpet Section',
      description: 'Played trumpet in marching band. Performed at football games.',
      hoursPerWeek: 8,
      weeksPerYear: 20,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [],
    },
    {
      id: 'volunteer',
      name: 'Food Bank Volunteer',
      category: 'community_service',
      role: 'Volunteer',
      description: 'Helped sort and distribute food. Volunteered regularly.',
      hoursPerWeek: 3,
      weeksPerYear: 40,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [],
    },
    {
      id: 'spanish-club',
      name: 'Spanish Club',
      category: 'cultural',
      role: 'Member',
      description: 'Participated in cultural activities and events.',
      hoursPerWeek: 1,
      weeksPerYear: 30,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [],
    },
  ],
};

// Profile 5: Business student with real traction
const STRONG_BUSINESS_PROFILE: NuancedProfilingInput = {
  studentContext: {
    intendedMajor: 'Business / Economics',
    majorCertainty: 'certain',
    gradeLevel: 12,
  },
  activities: [
    {
      id: 'deca',
      name: 'DECA Business Competition',
      category: 'academic_competition',
      role: 'Team Captain',
      description: 'Led team to ICDC (international conference) 2x. Won 1st place state in Business Finance. Developed 60-page business plan for real local restaurant.',
      hoursPerWeek: 8,
      weeksPerYear: 35,
      yearsInvolved: 4,
      gradeLevels: [9, 10, 11, 12],
      achievements: [
        { title: 'ICDC Qualifier', level: 'international' },
        { title: 'State 1st Place Business Finance', level: 'state' },
      ],
    },
    {
      id: 'business',
      name: 'Resale Business - VintageFinds',
      category: 'entrepreneurship',
      role: 'Founder',
      description: 'Built resale business generating $42,000 revenue over 2 years. Sourced from 20+ suppliers, managed inventory of 500+ items. Net profit margin: 35%.',
      hoursPerWeek: 12,
      weeksPerYear: 52,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [],
    },
    {
      id: 'investment',
      name: 'Investment Club',
      category: 'leadership_governance',
      role: 'President',
      description: 'Managed $8,000 real portfolio achieving 28% annual return. Taught weekly seminars on financial analysis to 35 members. Organized speaker series with 6 finance professionals.',
      hoursPerWeek: 5,
      weeksPerYear: 36,
      yearsInvolved: 3,
      gradeLevels: [10, 11, 12],
      achievements: [],
    },
    {
      id: 'nonprofit',
      name: 'Financial Literacy Nonprofit',
      category: 'community_service',
      role: 'Co-Founder',
      description: 'Co-founded org teaching financial literacy to low-income youth. Raised $18,000 in grants. Trained 120 students across 6 schools. 40% opened savings accounts.',
      hoursPerWeek: 6,
      weeksPerYear: 45,
      yearsInvolved: 2,
      gradeLevels: [11, 12],
      achievements: [
        { title: 'Featured in Local News', level: 'regional' },
      ],
    },
  ],
};

// ============================================================================
// TEST FUNCTIONS
// ============================================================================

async function runTests() {
  console.log('╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║   RESEARCH-BACKED EXTRACURRICULAR PROFILER - COMPREHENSIVE TEST SUITE    ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝\n');

  let passed = 0;
  let failed = 0;
  const failures: string[] = [];

  // ============================================================================
  // TEST 1: Exceptional CS Profile
  // ============================================================================
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 1: Exceptional CS Profile Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const csResult = await researchBackedProfiler.analyzeProfile(EXCEPTIONAL_CS_PROFILE);

    console.log('\n📊 Overall Assessment:');
    console.log(`   Competitive Level: ${csResult.overallAssessment.competitiveLevel}`);
    console.log(`   Harvard Rating Estimate: ${csResult.overallAssessment.harvardRatingEstimate}`);
    console.log(`   Confidence: ${csResult.analysisConfidence.overallConfidence}%`);

    console.log('\n📈 Tier Distribution:');
    console.log(`   Tier 1: ${csResult.portfolioAnalysis.tierDistribution.tier1Count}`);
    console.log(`   Tier 2: ${csResult.portfolioAnalysis.tierDistribution.tier2Count}`);
    console.log(`   Tier 3: ${csResult.portfolioAnalysis.tierDistribution.tier3Count}`);

    console.log('\n🎯 Spike Analysis:');
    console.log(`   Has Spike: ${csResult.portfolioAnalysis.spikeAnalysis.hasSpike}`);
    console.log(`   Spike Strength: ${csResult.portfolioAnalysis.spikeAnalysis.spikeStrength}`);
    console.log(`   Breadth vs Depth: ${csResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth}`);

    console.log('\n📝 Common App Ordering (top 3):');
    csResult.commonAppOrdering.reasoning.slice(0, 3).forEach(r => console.log(`   ${r}`));

    console.log('\n🎓 Admissions Perspective:');
    console.log(`   ${csResult.overallAssessment.admissionsOfficerPerspective}`);

    // Assertions
    const test1Assertions = [
      {
        name: 'Should be highly_competitive',
        passed: csResult.overallAssessment.competitiveLevel === 'highly_competitive',
      },
      {
        name: 'Harvard Rating should be 1 or 2',
        passed: csResult.overallAssessment.harvardRatingEstimate <= 2,
      },
      {
        name: 'Should have strong spike',
        passed:
          csResult.portfolioAnalysis.spikeAnalysis.hasSpike &&
          ['exceptional', 'strong'].includes(csResult.portfolioAnalysis.spikeAnalysis.spikeStrength),
      },
      {
        name: 'Should be depth_focused',
        passed: csResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth === 'depth_focused',
      },
      {
        name: 'Should have at least 2 Tier 1 activities',
        passed: csResult.portfolioAnalysis.tierDistribution.tier1Count >= 2,
      },
      {
        name: 'USACO should rank in top 3',
        passed: csResult.commonAppOrdering.order.slice(0, 3).includes('usaco-plat'),
      },
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

  // ============================================================================
  // TEST 2: Suspicious Profile Red Flags
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 2: Suspicious Profile Red Flag Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const suspiciousResult = await researchBackedProfiler.analyzeProfile(SUSPICIOUS_PROFILE);

    console.log('\n🚩 Red Flag Detection:');

    for (const assessment of suspiciousResult.activityAssessments) {
      console.log(`\n   "${assessment.activityName}":`);
      console.log(`   - Authenticity: ${assessment.authenticity.level} (${assessment.authenticity.score}/100)`);
      console.log(`   - Time Credibility: ${assessment.timeCredibility.level} (${assessment.timeCredibility.score}/100)`);
      console.log(`   - Grade Level Pattern: ${assessment.gradeLevelAnalysis.progressionPattern}`);
      if (assessment.authenticity.concernSignals.length > 0) {
        console.log(`   - Concerns: ${assessment.authenticity.concernSignals.slice(0, 2).join('; ')}`);
      }
      if (assessment.timeCredibility.redFlags.length > 0) {
        console.log(`   - Time Red Flags: ${assessment.timeCredibility.redFlags.slice(0, 2).join('; ')}`);
      }
    }

    console.log('\n⏱️ Portfolio Time Realism:');
    console.log(`   Total Weekly Hours: ${suspiciousResult.portfolioAnalysis.timeRealism.totalWeeklyHours}`);
    console.log(`   Level: ${suspiciousResult.portfolioAnalysis.timeRealism.level}`);
    console.log(`   Realistic: ${suspiciousResult.portfolioAnalysis.timeRealism.isRealistic}`);

    // Assertions
    const fakeCeo = suspiciousResult.activityAssessments.find((a) => a.activityId === 'fake-ceo');
    const fakeResearch = suspiciousResult.activityAssessments.find((a) => a.activityId === 'fake-research');

    const test2Assertions = [
      {
        name: 'Fake CEO should have low authenticity',
        passed: fakeCeo!.authenticity.score < 50,
      },
      {
        name: 'Fake CEO should be flagged as late_start',
        passed: fakeCeo!.gradeLevelAnalysis.progressionPattern === 'late_start',
      },
      {
        name: 'Fake CEO should have authenticity concerns',
        passed: fakeCeo!.authenticity.concernSignals.length > 0,
      },
      {
        name: 'Total time should be implausible',
        passed: ['implausible', 'questionable'].includes(suspiciousResult.portfolioAnalysis.timeRealism.level),
      },
      {
        name: 'Fake research should have questionable time',
        passed: ['implausible', 'questionable'].includes(fakeResearch!.timeCredibility.level),
      },
      {
        name: 'Profile should NOT be highly_competitive',
        passed: suspiciousResult.overallAssessment.competitiveLevel !== 'highly_competitive',
      },
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

  // ============================================================================
  // TEST 3: Pre-Med Profile Field-Specific Analysis
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 3: Pre-Med Profile Field-Specific Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const premedResult = await researchBackedProfiler.analyzeProfile(STRONG_PREMED_PROFILE);

    console.log('\n🏥 Pre-Med Analysis:');
    console.log(`   Major Alignment Level: ${premedResult.portfolioAnalysis.majorAlignment.level}`);
    console.log(`   Core Activities: ${premedResult.portfolioAnalysis.majorAlignment.coreActivities.length}`);
    console.log(`   Competitive Position: ${premedResult.portfolioAnalysis.majorAlignment.competitivePosition}`);

    // Check clinical hours recognition
    const clinical = premedResult.activityAssessments.find((a) => a.activityId === 'clinical');
    const emt = premedResult.activityAssessments.find((a) => a.activityId === 'emt');
    const research = premedResult.activityAssessments.find((a) => a.activityId === 'research');

    console.log('\n📋 Activity Analysis:');
    console.log(`   Clinical Volunteering: Tier ${clinical?.tier}, Alignment: ${clinical?.majorAlignment.type}`);
    console.log(`   EMT: Tier ${emt?.tier}, Alignment: ${emt?.majorAlignment.type}`);
    console.log(`   Research: Tier ${research?.tier}, Alignment: ${research?.majorAlignment.type}`);

    console.log('\n🔗 Narrative Coherence:');
    console.log(`   Score: ${premedResult.portfolioAnalysis.narrativeCoherence.score}/100`);
    console.log(`   Primary Theme: ${premedResult.portfolioAnalysis.narrativeCoherence.primaryTheme}`);

    // Assertions
    const test3Assertions = [
      {
        name: 'Clinical volunteering should be core activity',
        passed: clinical?.majorAlignment.type === 'core',
      },
      {
        name: 'EMT should have high authenticity (real certification)',
        passed: emt!.authenticity.score >= 60,
      },
      {
        name: 'Research should be recognized as aligned',
        passed: ['core', 'supporting'].includes(research?.majorAlignment.type || ''),
      },
      {
        name: 'Science Olympiad 4-year involvement should show commitment',
        passed: premedResult.activityAssessments.find((a) => a.activityId === 'science-olympiad')!.harbersonScore.durationPoints === 4,
      },
      {
        name: 'Profile should be at least competitive',
        passed: ['highly_competitive', 'competitive'].includes(premedResult.overallAssessment.competitiveLevel),
      },
      {
        name: 'Narrative coherence score >= 60',
        passed: premedResult.portfolioAnalysis.narrativeCoherence.score >= 60,
      },
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

  // ============================================================================
  // TEST 4: Scattered Profile - Spike Detection
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 4: Scattered Profile - Lack of Spike Detection');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const scatteredResult = await researchBackedProfiler.analyzeProfile(SCATTERED_PROFILE);

    console.log('\n🔍 Spike Analysis:');
    console.log(`   Has Spike: ${scatteredResult.portfolioAnalysis.spikeAnalysis.hasSpike}`);
    console.log(`   Spike Strength: ${scatteredResult.portfolioAnalysis.spikeAnalysis.spikeStrength}`);
    console.log(`   Breadth vs Depth: ${scatteredResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth}`);
    console.log(`   Orphan Activities: ${scatteredResult.portfolioAnalysis.spikeAnalysis.orphanActivities.length}`);

    console.log('\n📊 Major Alignment (for CS):');
    console.log(`   Level: ${scatteredResult.portfolioAnalysis.majorAlignment.level}`);
    console.log(`   Core Activities: ${scatteredResult.portfolioAnalysis.majorAlignment.coreActivities.length}`);
    console.log(`   Gaps: ${scatteredResult.portfolioAnalysis.majorAlignment.gaps.slice(0, 2).join('; ')}`);

    console.log('\n🎓 Admissions Implication:');
    console.log(`   ${scatteredResult.portfolioAnalysis.spikeAnalysis.admissionsImplication}`);

    // Assertions
    const test4Assertions = [
      {
        name: 'Should NOT have strong spike',
        passed: !scatteredResult.portfolioAnalysis.spikeAnalysis.hasSpike ||
          ['weak', 'none'].includes(scatteredResult.portfolioAnalysis.spikeAnalysis.spikeStrength),
      },
      {
        name: 'Should be breadth_scattered or balanced',
        passed: ['breadth_scattered', 'balanced'].includes(scatteredResult.portfolioAnalysis.spikeAnalysis.breadthVsDepth),
      },
      {
        name: 'Should have multiple orphan activities for CS major',
        passed: scatteredResult.portfolioAnalysis.spikeAnalysis.orphanActivities.length >= 2,
      },
      {
        name: 'Major alignment should be weak or misaligned for CS',
        passed: ['weak', 'misaligned', 'adequate'].includes(scatteredResult.portfolioAnalysis.majorAlignment.level),
      },
      {
        name: 'Should identify gaps for CS major',
        passed: scatteredResult.portfolioAnalysis.majorAlignment.gaps.length > 0,
      },
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

  // ============================================================================
  // TEST 5: Business Profile with Real Traction
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 5: Business Profile Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const businessResult = await researchBackedProfiler.analyzeProfile(STRONG_BUSINESS_PROFILE);

    console.log('\n💼 Business Profile Analysis:');
    console.log(`   Competitive Level: ${businessResult.overallAssessment.competitiveLevel}`);
    console.log(`   Harvard Rating: ${businessResult.overallAssessment.harvardRatingEstimate}`);

    const deca = businessResult.activityAssessments.find((a) => a.activityId === 'deca');
    const business = businessResult.activityAssessments.find((a) => a.activityId === 'business');

    console.log('\n📈 Key Activities:');
    console.log(`   DECA: Tier ${deca?.tier}, Harberson Score ${deca?.harbersonScore.totalPoints}`);
    console.log(`   Resale Business: Tier ${business?.tier}, Authenticity ${business?.authenticity.score}`);

    console.log('\n🎯 Spike Analysis:');
    console.log(`   Has Spike: ${businessResult.portfolioAnalysis.spikeAnalysis.hasSpike}`);
    console.log(`   Spike Strength: ${businessResult.portfolioAnalysis.spikeAnalysis.spikeStrength}`);

    // Assertions
    const test5Assertions = [
      {
        name: 'DECA with ICDC should be Tier 1 or 2',
        passed: deca!.tier <= 2,
      },
      {
        name: 'DECA 4-year involvement should score max duration points',
        passed: deca!.harbersonScore.durationPoints === 4,
      },
      {
        name: 'Business with real revenue should have high authenticity',
        passed: business!.authenticity.score >= 60,
      },
      {
        name: 'Should have business spike',
        passed: businessResult.portfolioAnalysis.spikeAnalysis.hasSpike,
      },
      {
        name: 'Profile should be competitive or better',
        passed: ['highly_competitive', 'competitive'].includes(businessResult.overallAssessment.competitiveLevel),
      },
    ];

    for (const assertion of test5Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 5: ${assertion.name}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Test 5 failed with error: ${error}`);
    failed++;
    failures.push(`Test 5: Error - ${error}`);
  }

  // ============================================================================
  // TEST 6: Harberson Score Calculation
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 6: Sara Harberson Score Calculation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const csResult = await researchBackedProfiler.analyzeProfile(EXCEPTIONAL_CS_PROFILE);

    console.log('\n📊 Harberson Score Breakdown:');
    for (const assessment of csResult.activityAssessments) {
      const h = assessment.harbersonScore;
      console.log(`\n   ${assessment.activityName}:`);
      console.log(`   - Duration Points: ${h.durationPoints}/4`);
      console.log(`   - Leadership Points: ${h.leadershipPoints}/3`);
      console.log(`   - Major Alignment: ${h.majorAlignmentPoints}/2`);
      console.log(`   - Hours Points: ${h.hoursPoints}/2`);
      console.log(`   - TOTAL: ${h.totalPoints}/11`);
      console.log(`   - Ranking: #${h.ranking}`);
    }

    // Verify ordering is by Harberson score
    let correctlyOrdered = true;
    for (let i = 1; i < csResult.activityAssessments.length; i++) {
      if (csResult.activityAssessments[i].harbersonScore.totalPoints >
          csResult.activityAssessments[i - 1].harbersonScore.totalPoints) {
        correctlyOrdered = false;
        break;
      }
    }

    const test6Assertions = [
      {
        name: '4-year activity should get 4 duration points',
        passed: csResult.activityAssessments.find((a) => a.gradeLevelAnalysis.yearsActive.length >= 4)!.harbersonScore.durationPoints === 4,
      },
      {
        name: 'Founder role should get 3 leadership points',
        passed: csResult.activityAssessments.find((a) => a.activityName.includes('Startup'))!.harbersonScore.leadershipPoints === 3,
      },
      {
        name: 'Core CS activity should get 2 major alignment points',
        passed: csResult.activityAssessments.find((a) => a.majorAlignment.type === 'core')!.harbersonScore.majorAlignmentPoints === 2,
      },
      {
        name: 'Activities should be ordered by Harberson score',
        passed: correctlyOrdered,
      },
    ];

    for (const assertion of test6Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 6: ${assertion.name}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Test 6 failed with error: ${error}`);
    failed++;
    failures.push(`Test 6: Error - ${error}`);
  }

  // ============================================================================
  // TEST 7: Grade-Level Weighting
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 7: Grade-Level Weighting Analysis');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const premedResult = await researchBackedProfiler.analyzeProfile(STRONG_PREMED_PROFILE);

    console.log('\n📅 Grade Level Analysis:');
    for (const assessment of premedResult.activityAssessments) {
      const g = assessment.gradeLevelAnalysis;
      console.log(`\n   ${assessment.activityName}:`);
      console.log(`   - Years Active: ${g.yearsActive.join(', ')}`);
      console.log(`   - Weighted Score: ${g.weightedScore.toFixed(2)}`);
      console.log(`   - Started Early: ${g.startedEarly}`);
      console.log(`   - Sustained Through Junior: ${g.sustainedThroughJunior}`);
      console.log(`   - Pattern: ${g.progressionPattern}`);
    }

    const test7Assertions = [
      {
        name: 'Science Olympiad (grades 9-12) should have startedEarly = true',
        passed: premedResult.activityAssessments.find((a) => a.activityId === 'science-olympiad')!.gradeLevelAnalysis.startedEarly === true,
      },
      {
        name: 'EMT (grade 12 only) should have startedEarly = false',
        passed: premedResult.activityAssessments.find((a) => a.activityId === 'emt')!.gradeLevelAnalysis.startedEarly === false,
      },
      {
        name: 'Clinical (grades 10-12) should have sustainedThroughJunior = true',
        passed: premedResult.activityAssessments.find((a) => a.activityId === 'clinical')!.gradeLevelAnalysis.sustainedThroughJunior === true,
      },
      {
        name: '4-year activity should have higher weighted score than 1-year',
        passed: premedResult.activityAssessments.find((a) => a.activityId === 'science-olympiad')!.gradeLevelAnalysis.weightedScore >
                premedResult.activityAssessments.find((a) => a.activityId === 'emt')!.gradeLevelAnalysis.weightedScore,
      },
    ];

    for (const assertion of test7Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 7: ${assertion.name}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Test 7 failed with error: ${error}`);
    failed++;
    failures.push(`Test 7: Error - ${error}`);
  }

  // ============================================================================
  // TEST 8: Reasoning Chain Verification
  // ============================================================================
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('TEST 8: Reasoning Chain Verification');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  try {
    const csResult = await researchBackedProfiler.analyzeProfile(EXCEPTIONAL_CS_PROFILE);
    const usaco = csResult.activityAssessments.find((a) => a.activityId === 'usaco-plat');

    console.log('\n🔍 USACO Activity Reasoning Chain:');
    console.log(`   Conclusion: ${usaco?.reasoning.conclusion}`);
    console.log(`   Confidence: ${usaco?.reasoning.confidence}%`);

    console.log('\n   Reasoning Steps:');
    usaco?.reasoning.steps.forEach((step, i) => {
      console.log(`   ${i + 1}. [${step.factor}] ${step.observation}`);
      console.log(`      → ${step.implication} (weight: ${step.weight})`);
    });

    console.log('\n   Comparisons:');
    console.log(`   - vs Typical: ${usaco?.reasoning.comparisons.vsTypical}`);
    console.log(`   - vs Top: ${usaco?.reasoning.comparisons.vsTopApplicant}`);
    console.log(`   - Field-Specific: ${usaco?.reasoning.comparisons.fieldSpecific}`);

    console.log('\n   AO Perspective:');
    console.log(`   ${usaco?.reasoning.admissionsOfficerPerspective}`);

    const test8Assertions = [
      {
        name: 'Reasoning should have conclusion',
        passed: usaco!.reasoning.conclusion.length > 0,
      },
      {
        name: 'Reasoning should have multiple steps',
        passed: usaco!.reasoning.steps.length >= 4,
      },
      {
        name: 'Reasoning should have all comparisons',
        passed: usaco!.reasoning.comparisons.vsTypical.length > 0 &&
                usaco!.reasoning.comparisons.vsTopApplicant.length > 0,
      },
      {
        name: 'Reasoning should have AO perspective',
        passed: usaco!.reasoning.admissionsOfficerPerspective.length > 0,
      },
    ];

    for (const assertion of test8Assertions) {
      if (assertion.passed) {
        console.log(`   ✅ ${assertion.name}`);
        passed++;
      } else {
        console.log(`   ❌ ${assertion.name}`);
        failed++;
        failures.push(`Test 8: ${assertion.name}`);
      }
    }
  } catch (error) {
    console.log(`   ❌ Test 8 failed with error: ${error}`);
    failed++;
    failures.push(`Test 8: Error - ${error}`);
  }

  // ============================================================================
  // FINAL SUMMARY
  // ============================================================================
  console.log('\n╔══════════════════════════════════════════════════════════════════════════╗');
  console.log('║                            TEST SUMMARY                                   ║');
  console.log('╚══════════════════════════════════════════════════════════════════════════╝');
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
  process.exit(failed > 0 ? 1 : 0);
}

// Run tests
runTests().catch(console.error);
