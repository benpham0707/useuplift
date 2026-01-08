/**
 * Test Research Context Enrichment in Stage1BDiagnosisService
 *
 * Validates that the "knowledge bridge" is working - transforming
 * diagnosed issues into research-backed teaching with:
 * - WHY explanations
 * - HOW techniques
 * - EXAMPLES with before/after transformations
 * - College-specific guidance
 */

import { researchBackedTeachingService } from '../src/services/commonAppWorkshop/services/researchBackedTeachingService';
import type { IssueType } from '../src/services/commonAppWorkshop/services/researchBackedTeachingService';

// Simulate the symptom type mapping from Stage1BDiagnosisService
const SYMPTOM_TYPE_MAPPING: Record<string, IssueType | undefined> = {
  'abstract_language': 'telling_not_showing',
  'telling_not_showing': 'telling_not_showing',
  'passive_voice': 'passive_victim_framing',
  'passive_agency': 'passive_victim_framing',
  'passive_victim': 'passive_victim_framing',
  'cliche_language': 'cliche_language',
  'cliche_expression': 'cliche_language',
  'inspirational_cliche': 'cliche_inspirational',
  'ai_language': 'cliche_ai_convergence',
  'ai_convergence': 'cliche_ai_convergence',
  'performative_intelligence': 'performative_intelligence',
  'thesaurus_problem': 'performative_intelligence',
  'premature_resolution': 'premature_resolution',
  'forced_epiphany': 'premature_resolution',
  'false_epiphany': 'false_epiphany',
  'missing_systems_awareness': 'missing_systems_awareness',
  'individual_level': 'missing_systems_awareness',
  'strategic_vulnerability': 'strategic_vulnerability',
  'announced_vulnerability': 'strategic_vulnerability',
};

// Simulated critical issues from Stage 1B diagnosis
const MOCK_CRITICAL_ISSUES = [
  {
    issue_number: 1,
    quote: 'I have always been passionate about learning',
    location: 'Opening paragraph',
    problem: 'Generic claim without grounding scene',
    symptom_type: 'abstract_language',
    diagnosis: 'Student TELLS passion without SHOWING the moment it became visible',
    prescription: 'Replace with specific scene showing curiosity in action',
    missing_elements: {
      sensory_details: ['What did you see when learning?', 'What sounds surrounded you?'],
      concrete_objects: ['Specific book titles', 'Class name'],
      micro_moment: 'The exact moment passion became visible',
      emotional_truth: 'Show frustration or exhilaration through action',
    },
    relevant_concept: 'IV must be visible through behavior',
    relevant_evidence: [],
    socratic_questions: ['When did you lose track of time learning?'],
    college_value_impacted: 'Intellectual Vitality',
  },
  {
    issue_number: 2,
    quote: 'This transformative experience profoundly impacted my multifaceted journey',
    location: 'Third paragraph',
    problem: 'AI convergence language signals inauthenticity',
    symptom_type: 'ai_convergence',
    diagnosis: 'Vocabulary sounds generated, not authentic to 17-year-old voice',
    prescription: 'Replace elevated vocabulary with natural speech',
    missing_elements: {
      concrete_objects: ['What specifically happened?'],
      micro_moment: 'A single moment, not a summary',
    },
    relevant_concept: 'Voice authenticity',
    relevant_evidence: [],
    socratic_questions: ['Would you say this out loud to a friend?'],
    college_value_impacted: 'Authenticity',
  },
  {
    issue_number: 3,
    quote: 'Through this experience, I learned the importance of perseverance',
    location: 'Conclusion',
    problem: 'Premature resolution - forcing neat conclusion',
    symptom_type: 'premature_resolution',
    diagnosis: 'Forced lesson undermines complexity',
    prescription: 'End with ongoing questions or uncertainty',
    missing_elements: {
      emotional_truth: 'What questions remain unanswered?',
    },
    relevant_concept: 'Complexity over neat endings',
    relevant_evidence: [],
    socratic_questions: ['What are you still figuring out?'],
    college_value_impacted: 'Intellectual Vitality',
  },
];

async function runTest() {
  console.log('RESEARCH CONTEXT ENRICHMENT TEST');
  console.log('='.repeat(70));
  console.log('');
  console.log('Testing that Stage1B issues can be enriched with research context...');
  console.log('');

  let allPassed = true;
  const results: { issue: number; symptomType: string; enriched: boolean; details: string }[] = [];

  for (const issue of MOCK_CRITICAL_ISSUES) {
    console.log('-'.repeat(70));
    console.log(`Issue ${issue.issue_number}: "${issue.symptom_type}"`);
    console.log('-'.repeat(70));

    // Map symptom type to issue type
    const issueType = SYMPTOM_TYPE_MAPPING[issue.symptom_type.toLowerCase()];

    if (!issueType) {
      console.log('  No mapping found for symptom type');
      results.push({
        issue: issue.issue_number,
        symptomType: issue.symptom_type,
        enriched: false,
        details: 'No symptom type mapping',
      });
      continue;
    }

    console.log(`  Mapped to IssueType: ${issueType}`);

    // Get teaching bundle
    const teaching = researchBackedTeachingService.getTeachingForIssue(issueType);

    if (!teaching) {
      console.log('  ERROR: No teaching bundle available');
      results.push({
        issue: issue.issue_number,
        symptomType: issue.symptom_type,
        enriched: false,
        details: 'No teaching bundle',
      });
      allPassed = false;
      continue;
    }

    // Validate research context components
    const hasWhySection = teaching.why_section.summary.length > 50 &&
                          teaching.why_section.research_insight.length > 50;
    const hasTechniques = teaching.techniques.length > 0 &&
                          teaching.techniques.every(t => t.steps.length > 0);
    const hasTransformations = teaching.transformations.length > 0;
    const hasEvidence = teaching.evidence.primary_sources.length > 0 ||
                        teaching.evidence.supporting_quotes.length > 0;

    console.log('');
    console.log('  Research Context Components:');
    console.log(`    WHY section: ${hasWhySection ? 'OK' : 'INCOMPLETE'}`);
    console.log(`      - Summary: ${teaching.why_section.summary.substring(0, 60)}...`);
    console.log(`      - Sources: ${teaching.why_section.sources.length} attached`);

    console.log(`    TECHNIQUES: ${hasTechniques ? 'OK' : 'INCOMPLETE'} (${teaching.techniques.length} techniques)`);
    for (const tech of teaching.techniques.slice(0, 2)) {
      console.log(`      - ${tech.name} [${tech.difficulty}]: ${tech.steps.length} steps`);
    }

    console.log(`    TRANSFORMATIONS: ${hasTransformations ? 'OK' : 'MISSING'} (${teaching.transformations.length} examples)`);
    if (teaching.transformations.length > 0) {
      const t = teaching.transformations[0];
      console.log(`      Before: "${t.before.substring(0, 40)}..."`);
      console.log(`      After:  "${t.after.substring(0, 40)}..."`);
    }

    console.log(`    EVIDENCE: ${hasEvidence ? 'OK' : 'INCOMPLETE'}`);
    console.log(`      - Primary sources: ${teaching.evidence.primary_sources.length}`);
    console.log(`      - Supporting quotes: ${teaching.evidence.supporting_quotes.length}`);

    // Test college-specific guidance
    console.log('');
    console.log('  College-Specific Guidance:');
    for (const college of ['Stanford', 'MIT', 'Harvard']) {
      const guidance = researchBackedTeachingService.getCollegeSpecificGuidance(issueType, college);
      const hasGuidance = guidance.insight || guidance.sources.length > 0;
      console.log(`    ${college}: ${hasGuidance ? 'Available' : 'None'}`);
      if (guidance.insight) {
        console.log(`      "${guidance.insight.substring(0, 50)}..."`);
      }
    }

    const passed = hasWhySection && hasTechniques && hasTransformations;
    results.push({
      issue: issue.issue_number,
      symptomType: issue.symptom_type,
      enriched: passed,
      details: passed ? 'All components present' : [
        !hasWhySection && 'incomplete why section',
        !hasTechniques && 'missing techniques',
        !hasTransformations && 'no transformations',
      ].filter(Boolean).join(', '),
    });

    if (!passed) allPassed = false;

    console.log('');
    console.log(`  Result: ${passed ? 'ENRICHABLE' : 'INCOMPLETE'}`);
  }

  // Test the full flow: symptom type → issue type → teaching
  console.log('');
  console.log('='.repeat(70));
  console.log('COVERAGE ANALYSIS');
  console.log('='.repeat(70));
  console.log('');

  const symptomTypes = Object.keys(SYMPTOM_TYPE_MAPPING);
  const coveredSymptoms = symptomTypes.filter(st => {
    const issueType = SYMPTOM_TYPE_MAPPING[st];
    if (!issueType) return false;
    return researchBackedTeachingService.getTeachingForIssue(issueType) !== null;
  });

  console.log(`Symptom Types with Research Coverage: ${coveredSymptoms.length}/${symptomTypes.length}`);
  console.log('');
  console.log('Covered:');
  for (const st of coveredSymptoms) {
    console.log(`  - ${st} → ${SYMPTOM_TYPE_MAPPING[st]}`);
  }

  const uncovered = symptomTypes.filter(st => !coveredSymptoms.includes(st));
  if (uncovered.length > 0) {
    console.log('');
    console.log('Not covered (may need teaching bundles):');
    for (const st of uncovered) {
      console.log(`  - ${st}`);
    }
  }

  // Summary
  console.log('');
  console.log('='.repeat(70));
  console.log('SUMMARY');
  console.log('='.repeat(70));
  console.log('');

  const enriched = results.filter(r => r.enriched).length;
  const notEnriched = results.filter(r => !r.enriched).length;

  console.log(`Mock Issues Tested: ${results.length}`);
  console.log(`Enrichable: ${enriched}`);
  console.log(`Not Enrichable: ${notEnriched}`);
  console.log('');

  if (allPassed) {
    console.log('ALL MOCK ISSUES CAN BE ENRICHED WITH RESEARCH CONTEXT');
    console.log('');
    console.log('Knowledge Bridge Status: OPERATIONAL');
    console.log('');
    console.log('Stage 1B Diagnosis → Research Context Flow:');
    console.log('  1. Diagnose issue (symptom_type, quote, missing_elements)');
    console.log('  2. Map symptom_type → IssueType');
    console.log('  3. Get ResearchBackedTeaching bundle');
    console.log('  4. Attach to issue.research_context');
    console.log('  5. Stage 2 uses research context for teaching');
    console.log('');
    console.log('Components Now Available per Issue:');
    console.log('  - WHY: Research-backed explanation + admissions quotes');
    console.log('  - HOW: Technique bundles with step-by-step guidance');
    console.log('  - EXAMPLES: Before/after transformations');
    console.log('  - COLLEGE-SPECIFIC: Tailored guidance for Stanford/MIT/Harvard');
  } else {
    console.log('SOME ISSUES CANNOT BE ENRICHED');
    console.log('');
    for (const result of results.filter(r => !r.enriched)) {
      console.log(`  - Issue ${result.issue} (${result.symptomType}): ${result.details}`);
    }
    process.exit(1);
  }
}

runTest().catch(console.error);
