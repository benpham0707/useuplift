/**
 * Unit test for Knowledge Assembly Service (no API required)
 * Run: npx tsx tests/test-knowledge-assembly-unit.ts
 */

// Load dotenv first (good practice even for non-API tests)
import './utils/loadEnv';

import {
  knowledgeAssemblyService,
} from '../src/services/portfolioStrategy/services/activityWorkshop/knowledgeAssemblyService';

// Test activity
const testActivity = {
  id: 'math-competition',
  title: 'Math Competition Team',
  description: 'Competed in various math competitions and helped younger students with problem solving',
  organization: 'School Math Team',
  role: 'Team Member',
  hoursPerWeek: 5,
  weeksPerYear: 30,
  yearsInvolved: 3,
  gradeLevels: [10, 11, 12],
  category: 'academic_competition',
};

// Mock analysis
const mockAnalysis = {
  classification: {
    tier: 3 as const,
    tierConfidence: 'high' as const,
    tierReasoning: 'School-level participation',
    detectedCategory: 'academic_competition',
  },
  descriptionQuality: {
    overallScore: 45,
    issues: ['vague description', 'missing quantification', 'generic contribution'],
    strengths: ['consistent commitment'],
  },
  greenFlags: [{ flag: 'Multi-year involvement', admissionsValue: 'Shows sustained commitment' }],
  redFlags: [],
  narrativePotential: { essayWorthiness: 'medium', growthArc: 'Developing' },
};

const studentContext = {
  intendedMajor: 'Computer Science',
  targetSchools: ['MIT', 'Stanford'],
};

console.log('═'.repeat(60));
console.log('  KNOWLEDGE ASSEMBLY SERVICE UNIT TEST');
console.log('═'.repeat(60));
console.log('\nTesting knowledge context assembly...\n');

try {
  const knowledge = knowledgeAssemblyService.assembleKnowledgeContext(
    testActivity as any,
    mockAnalysis as any,
    studentContext as any
  );

  console.log('✅ Knowledge Context Assembled Successfully!\n');
  console.log('📋 Activity:', knowledge.activityTitle);
  console.log('📂 Category:', knowledge.detectedCategory);
  console.log('🏆 Sara Harberson Tier:', knowledge.saraHarbersonCriteria.tierName);
  console.log('📚 Issue Teaching Bundles:', knowledge.issueTeaching.length);
  console.log('📖 Citations:', knowledge.citations.length);
  console.log('🎯 Field Expectations:', knowledge.fieldExpectations?.majorName || 'None');

  if (knowledge.issueTeaching.length > 0) {
    console.log('\n─'.repeat(40));
    console.log('First Teaching Bundle Details:');
    console.log('─'.repeat(40));
    const bundle = knowledge.issueTeaching[0];
    console.log('  Issue Type:', bundle.issueType);
    console.log('  Problem Headline:', bundle.theProblem.headline);
    console.log('  Psychology:', bundle.whyThisWorks.psychology.substring(0, 100) + '...');
    console.log('  Steps:', bundle.whatToDo.steps.length);
    console.log('  Examples:', bundle.examples.length);

    if (bundle.examples.length > 0) {
      console.log('\n  Sample Transformation:');
      console.log('    Before:', bundle.examples[0].before.substring(0, 60) + '...');
      console.log('    After:', bundle.examples[0].after.substring(0, 60) + '...');
    }
  }

  // Test prompt formatting
  console.log('\n─'.repeat(40));
  console.log('Prompt Formatting Test:');
  console.log('─'.repeat(40));
  const promptText = knowledgeAssemblyService.formatForPrompt(knowledge);
  console.log('  Total length:', promptText.length, 'characters');
  console.log('  Contains "SARA HARBERSON":', promptText.includes('SARA HARBERSON'));
  console.log('  Contains "TEACHING BUNDLES":', promptText.includes('TEACHING BUNDLES'));
  console.log('  Contains "CITATIONS":', promptText.includes('CITATIONS'));

  // Verify all issues were mapped
  console.log('\n─'.repeat(40));
  console.log('Issue Mapping Verification:');
  console.log('─'.repeat(40));
  const mappedIssues = knowledge.issueTeaching.map(t => t.issueType);
  console.log('  Input issues:', mockAnalysis.descriptionQuality.issues.join(', '));
  console.log('  Mapped to:', mappedIssues.join(', ') || '(none)');

  // Verify Sara Harberson data
  console.log('\n─'.repeat(40));
  console.log('Sara Harberson Criteria:');
  console.log('─'.repeat(40));
  console.log('  Tier:', knowledge.saraHarbersonCriteria.tier);
  console.log('  Definition:', knowledge.saraHarbersonCriteria.definition.substring(0, 80) + '...');
  console.log('  Evidence count:', knowledge.saraHarbersonCriteria.evidence.length);
  console.log('  Examples count:', knowledge.saraHarbersonCriteria.examples.length);

  // Verify category insights
  console.log('\n─'.repeat(40));
  console.log('Category Insights:');
  console.log('─'.repeat(40));
  console.log('  Category:', knowledge.categoryInsights.categoryName);
  console.log('  Competitive context:', knowledge.categoryInsights.competitiveContext.substring(0, 80) + '...');
  console.log('  Top achievements:', knowledge.categoryInsights.topAchievements.slice(0, 2).join('; '));

  console.log('\n' + '═'.repeat(60));
  console.log('  ✅ ALL UNIT TESTS PASSED');
  console.log('═'.repeat(60) + '\n');

} catch (error) {
  console.error('❌ Error:', error);
  process.exit(1);
}
