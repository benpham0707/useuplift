/**
 * Phase 17 Test: Experience Fingerprinting & Anti-Convergence
 *
 * Tests the new Experience Fingerprint system that:
 * 1. Extracts what's unique about each student's experience
 * 2. Detects convergence patterns (typical arc, generic insights, etc.)
 * 3. Ensures suggestions incorporate unique elements
 * 4. Breaks beyond AI's natural tendency toward safe, similar outputs
 *
 * Key validations:
 * - Different essays produce different fingerprints (no convergence)
 * - Anti-pattern flags correctly identify generic vs. unique essays
 * - Divergence constraints are meaningful and specific
 * - Quality anchors preserve what's already working
 */

import {
  analyzeExperienceFingerprint,
  buildDivergenceConstraints,
  ExperienceFingerprint
} from '../src/services/narrativeWorkshop/analyzers/experienceFingerprintAnalyzer';
import { analyzeVoiceFingerprint } from '../src/services/narrativeWorkshop/analyzers/voiceFingerprintAnalyzer';
import * as fs from 'fs';

// ============================================================================
// TEST ESSAYS - Designed to test different fingerprint outcomes
// ============================================================================

const UNIQUE_ESSAY = `
The smell of burnt plastic still takes me back to that garage - not my garage, but my grandmother's,
in the village where electricity came three hours a day if we were lucky.

I didn't set out to build a solar-powered phone charger. I set out to win an argument with my cousin
Raj, who said village kids couldn't understand "real technology." Spite, it turns out, is a powerful
motivator.

The first prototype exploded. Actually exploded. There's still a scorch mark on Grandma's workbench.
She looked at it, then at me, then said in Hindi: "Your grandfather blew up his first engine too.
He went on to build the tractor that saved our harvest." Then she made me clean up the mess.

What I remember most isn't the day it finally worked - it's the night before, when I almost gave up.
I was sitting in the dark (power was out, of course) wondering if Raj was right. Then my grandmother
turned on a flashlight - one of those old ones you have to crank - and said, "The light doesn't
care where it comes from. It just shines."

I think about that when people ask about my "origin story" in engineering. There is no origin story.
There's just a grandmother who wouldn't let me quit, a cousin I wanted to prove wrong, and a scorch
mark that reminds me that every good thing I've built started as a small explosion.
`;

const GENERIC_ESSAY = `
I have always been passionate about technology and innovation. From a young age, I was fascinated
by how things work, constantly taking apart gadgets to understand their inner mechanisms.

My journey in robotics began when I joined my high school's robotics club. Initially, I struggled
with the complex concepts, but through hard work and dedication, I gradually improved. My mentor
believed in me even when I doubted myself, and this support was instrumental in my growth.

One of my proudest achievements was when our team competed at the state championship. We faced many
challenges along the way - long nights of coding, unexpected technical failures, and moments of
frustration. But we persevered. When we won second place, I realized that the journey was more
important than the destination.

This experience taught me valuable lessons about teamwork, resilience, and the importance of
never giving up. I learned that failure is not the opposite of success, but a stepping stone to it.

Looking forward, I am excited to continue my exploration of technology at your university. I believe
that my passion for innovation, combined with my work ethic and collaborative spirit, will enable
me to contribute meaningfully to your community and pursue my dreams of becoming an engineer.
`;

const CULTURALLY_SPECIFIC_ESSAY = `
In my family, we don't say "I love you." We say "Have you eaten?" It's not a question about food -
it's a declaration of concern wrapped in practicality, the way Vietnamese mothers have said
"I would die for you" for generations.

My parents own a nail salon. Not the Instagram kind with marble counters and latte machines. The
kind where the smell of acetone is stronger than the incense, where my homework sat next to foot
baths, where I learned English from customers before I learned it in school.

I used to be embarrassed. In middle school, I'd say my mom worked in "beauty services." I'd
never invite friends over because our apartment was above the salon, and you could always
hear Mrs. Nguyen's TV through the floor.

The turning point wasn't dramatic. It was a Thursday, slow afternoon, watching my mother
massage a client's hands. The woman was crying - not about her nails, about her husband, about
something broken I was too young to understand. And my mother just listened, hands moving in
circles, saying nothing, holding space.

That's when I understood: my mother is a therapist. She just happens to paint nails while she
does it. She carries the weight of a hundred strangers' secrets, and she never tells, and she
wakes up the next morning and does it again.

I don't know what I want to study yet. But I know I want to be someone who holds space. Who
asks "have you eaten?" and means "I see you." Who finds the extraordinary in the acetone smell
of an ordinary Tuesday.
`;

// ============================================================================
// TEST EXECUTION
// ============================================================================

async function runExperienceFingerprintTest() {
  console.log('='.repeat(80));
  console.log('PHASE 17 TEST: EXPERIENCE FINGERPRINTING & ANTI-CONVERGENCE');
  console.log('='.repeat(80));
  console.log();

  const results: any = {
    essays: [],
    comparisons: [],
    antiPatternAnalysis: [],
    divergenceQuality: []
  };

  // Test 1: Analyze each essay
  console.log('━'.repeat(80));
  console.log('TEST 1: EXTRACTING EXPERIENCE FINGERPRINTS');
  console.log('━'.repeat(80));
  console.log();

  const essays = [
    { name: 'UNIQUE_ESSAY (Village solar charger)', text: UNIQUE_ESSAY },
    { name: 'GENERIC_ESSAY (Robotics club)', text: GENERIC_ESSAY },
    { name: 'CULTURALLY_SPECIFIC_ESSAY (Nail salon)', text: CULTURALLY_SPECIFIC_ESSAY }
  ];

  const fingerprints: { name: string; fingerprint: ExperienceFingerprint }[] = [];

  for (const essay of essays) {
    console.log(`\n📝 Analyzing: ${essay.name}`);
    console.log('-'.repeat(60));

    // First get voice fingerprint (needed for context)
    const voice = await analyzeVoiceFingerprint(essay.text);

    // Then get experience fingerprint
    const fingerprint = await analyzeExperienceFingerprint(essay.text, voice);

    fingerprints.push({ name: essay.name, fingerprint });

    // Log key findings (with safe access)
    console.log(`\n   📍 UNIQUE ELEMENTS FOUND:`);

    const safeLog = (label: string, obj: any, field: string) => {
      if (obj && obj[field]) {
        console.log(`   • ${label}: ${String(obj[field]).substring(0, 80)}`);
        return true;
      } else {
        console.log(`   • ${label}: ❌ None detected`);
        return false;
      }
    };

    safeLog('Unusual Circumstance', fingerprint.unusualCircumstance, 'description');
    if (fingerprint.unexpectedEmotion?.emotion) {
      console.log(`   • Unexpected Emotion: ${fingerprint.unexpectedEmotion.emotion}`);
    } else {
      console.log(`   • Unexpected Emotion: ❌ None detected`);
    }
    safeLog('Contrary Insight', fingerprint.contraryInsight, 'insight');
    safeLog('Sensory Anchor', fingerprint.specificSensoryAnchor, 'sensory');
    safeLog('Unique Relationship', fingerprint.uniqueRelationship, 'dynamic');
    safeLog('Cultural Element', fingerprint.culturalSpecificity, 'element');

    // Log anti-pattern flags
    console.log(`\n   ⚠️ ANTI-PATTERN FLAGS:`);
    const flags = fingerprint.antiPatternFlags || {};
    console.log(`   • Follows typical arc: ${flags.followsTypicalArc ? '⚠️ YES' : '✅ No'}`);
    console.log(`   • Has generic insight: ${flags.hasGenericInsight ? '⚠️ YES' : '✅ No'}`);
    console.log(`   • Has manufactured beat: ${flags.hasManufacturedBeat ? '⚠️ YES' : '✅ No'}`);
    console.log(`   • Has crowd-pleaser: ${flags.hasCrowdPleaser ? '⚠️ YES' : '✅ No'}`);

    if (flags.warnings && flags.warnings.length > 0) {
      console.log(`   • Warnings: ${flags.warnings.join(', ')}`);
    }

    // Log quality anchors
    console.log(`\n   ⚓ QUALITY ANCHORS (to preserve):`);
    if (fingerprint.qualityAnchors && fingerprint.qualityAnchors.length > 0) {
      fingerprint.qualityAnchors.forEach((anchor: any, i: number) => {
        const sentence = anchor?.sentence || anchor?.text || '(no text)';
        const why = anchor?.whyItWorks || anchor?.why_it_works || '(no explanation)';
        console.log(`   ${i + 1}. "${String(sentence).substring(0, 60)}..."`);
        console.log(`      → Why: ${why}`);
      });
    } else {
      console.log(`   (No anchors identified)`);
    }

    // Log confidence
    console.log(`\n   📊 Confidence Score: ${fingerprint.confidenceScore || 0}/100`);

    results.essays.push({
      name: essay.name,
      fingerprint: {
        hasUnusualCircumstance: !!fingerprint.unusualCircumstance,
        hasUnexpectedEmotion: !!fingerprint.unexpectedEmotion,
        hasContraryInsight: !!fingerprint.contraryInsight,
        hasSensoryAnchor: !!fingerprint.specificSensoryAnchor,
        hasUniqueRelationship: !!fingerprint.uniqueRelationship,
        hasCulturalSpecificity: !!fingerprint.culturalSpecificity,
        antiPatternFlags: flags,
        qualityAnchorsCount: fingerprint.qualityAnchors?.length || 0,
        confidenceScore: fingerprint.confidenceScore
      }
    });
  }

  // Test 2: Compare fingerprints (ensure diversity)
  console.log('\n\n━'.repeat(80));
  console.log('TEST 2: FINGERPRINT DIVERSITY (Anti-Convergence)');
  console.log('━'.repeat(80));
  console.log();

  console.log('Comparing fingerprints to ensure essays produce distinct results:\n');

  // Compare unique elements
  const uniqueElements = fingerprints.map(fp => {
    const elements: string[] = [];
    if (fp.fingerprint.unusualCircumstance) elements.push('unusual-circumstance');
    if (fp.fingerprint.unexpectedEmotion) elements.push('unexpected-emotion');
    if (fp.fingerprint.contraryInsight) elements.push('contrary-insight');
    if (fp.fingerprint.specificSensoryAnchor) elements.push('sensory-anchor');
    if (fp.fingerprint.uniqueRelationship) elements.push('unique-relationship');
    if (fp.fingerprint.culturalSpecificity) elements.push('cultural-specificity');
    return { name: fp.name, elements, count: elements.length };
  });

  uniqueElements.forEach(essay => {
    console.log(`${essay.name}:`);
    console.log(`   Elements found: ${essay.count}/6`);
    console.log(`   Types: ${essay.elements.join(', ') || '(none)'}`);
    console.log();
  });

  // Verify generic essay has more warnings
  const genericFingerprint = fingerprints.find(fp => fp.name.includes('GENERIC'));
  const uniqueEssayFingerprint = fingerprints.find(fp => fp.name.includes('UNIQUE'));

  if (genericFingerprint && uniqueEssayFingerprint) {
    const genericFlags = genericFingerprint.fingerprint.antiPatternFlags;
    const uniqueFlags = uniqueEssayFingerprint.fingerprint.antiPatternFlags;

    const genericFlagCount = [
      genericFlags.followsTypicalArc,
      genericFlags.hasGenericInsight,
      genericFlags.hasManufacturedBeat,
      genericFlags.hasCrowdPleaser
    ].filter(Boolean).length;

    const uniqueFlagCount = [
      uniqueFlags.followsTypicalArc,
      uniqueFlags.hasGenericInsight,
      uniqueFlags.hasManufacturedBeat,
      uniqueFlags.hasCrowdPleaser
    ].filter(Boolean).length;

    console.log(`Anti-pattern comparison:`);
    console.log(`   Generic essay flags: ${genericFlagCount}/4`);
    console.log(`   Unique essay flags: ${uniqueFlagCount}/4`);
    console.log(`   ${genericFlagCount > uniqueFlagCount ? '✅ Generic essay correctly flagged with more warnings' : '⚠️ Unique essay has more flags than generic (unexpected)'}`);

    results.comparisons.push({
      test: 'Generic vs Unique flag count',
      genericFlagCount,
      uniqueFlagCount,
      passed: genericFlagCount > uniqueFlagCount
    });
  }

  // Test 3: Divergence constraints quality
  console.log('\n━'.repeat(80));
  console.log('TEST 3: DIVERGENCE CONSTRAINTS QUALITY');
  console.log('━'.repeat(80));
  console.log();

  for (const fp of fingerprints) {
    console.log(`\n📋 Divergence Constraints for ${fp.name}:`);
    console.log('-'.repeat(60));

    const constraints = buildDivergenceConstraints(fp.fingerprint);
    console.log(constraints);

    // Check quality of constraints
    const constraintLength = constraints.length;
    const hasMustInclude = constraints.includes('MUST INCORPORATE');
    const hasMustAvoid = constraints.includes('MUST AVOID');
    const hasUniqueAngle = constraints.includes('UNIQUE ANGLE');
    const hasAntiConvergence = constraints.includes('ANTI-CONVERGENCE');

    results.divergenceQuality.push({
      essay: fp.name,
      constraintLength,
      hasMustInclude,
      hasMustAvoid,
      hasUniqueAngle,
      hasAntiConvergence,
      isSubstantial: constraintLength > 200
    });
  }

  // Test 4: Success Criteria
  console.log('\n━'.repeat(80));
  console.log('TEST 4: SUCCESS CRITERIA');
  console.log('━'.repeat(80));
  console.log();

  const criteria = [
    {
      name: 'Unique essay detected unique elements (3+ found)',
      test: () => {
        const fp = fingerprints.find(f => f.name.includes('UNIQUE'));
        const count = [
          fp?.fingerprint.unusualCircumstance,
          fp?.fingerprint.unexpectedEmotion,
          fp?.fingerprint.contraryInsight,
          fp?.fingerprint.specificSensoryAnchor,
          fp?.fingerprint.uniqueRelationship,
          fp?.fingerprint.culturalSpecificity
        ].filter(Boolean).length;
        return count >= 3;
      }
    },
    {
      name: 'Generic essay flagged for typical arc',
      test: () => {
        const fp = fingerprints.find(f => f.name.includes('GENERIC'));
        return fp?.fingerprint.antiPatternFlags.followsTypicalArc === true;
      }
    },
    {
      name: 'Generic essay flagged for generic insight',
      test: () => {
        const fp = fingerprints.find(f => f.name.includes('GENERIC'));
        return fp?.fingerprint.antiPatternFlags.hasGenericInsight === true;
      }
    },
    {
      name: 'Cultural essay detected cultural specificity',
      test: () => {
        const fp = fingerprints.find(f => f.name.includes('CULTURAL'));
        return fp?.fingerprint.culturalSpecificity !== null;
      }
    },
    {
      name: 'All essays have divergence requirements',
      test: () => {
        return fingerprints.every(fp =>
          fp.fingerprint.divergenceRequirements &&
          fp.fingerprint.divergenceRequirements.mustInclude !== undefined
        );
      }
    },
    {
      name: 'Unique essay has higher confidence than generic',
      test: () => {
        const uniqueFp = fingerprints.find(f => f.name.includes('UNIQUE'));
        const genericFp = fingerprints.find(f => f.name.includes('GENERIC'));
        return (uniqueFp?.fingerprint.confidenceScore || 0) > (genericFp?.fingerprint.confidenceScore || 0);
      }
    },
    {
      name: 'Divergence constraints are substantive (>200 chars)',
      test: () => {
        return fingerprints.every(fp => {
          const constraints = buildDivergenceConstraints(fp.fingerprint);
          return constraints.length > 200;
        });
      }
    }
  ];

  const criteriaResults = criteria.map(c => ({
    name: c.name,
    passed: c.test()
  }));

  criteriaResults.forEach(result => {
    const icon = result.passed ? '✅' : '❌';
    console.log(`${icon} ${result.name}`);
  });

  const passedCount = criteriaResults.filter(r => r.passed).length;
  const totalCount = criteriaResults.length;

  console.log();
  console.log(`Overall: ${passedCount}/${totalCount} criteria passed`);
  console.log(passedCount === totalCount ? '✅ ALL TESTS PASSED' : '⚠️ SOME TESTS FAILED');

  // Save results
  const output = {
    timestamp: new Date().toISOString(),
    results,
    criteriaResults,
    summary: {
      allCriteriaPassed: passedCount === totalCount,
      passedCount,
      totalCount
    }
  };

  const outputPath = 'TEST_OUTPUT_EXPERIENCE_FINGERPRINT.json';
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`\n📄 Detailed results saved to: ${outputPath}`);
}

// Run test
runExperienceFingerprintTest().catch(console.error);
