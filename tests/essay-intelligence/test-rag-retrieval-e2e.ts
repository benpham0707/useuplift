/**
 * RAG Retrieval E2E Test
 *
 * Seeds test fragments and transformations into the RAG database,
 * then verifies retrieval by dimension, technique, and cross-filter queries.
 *
 * Pass criteria: 8/10 queries return relevant results
 *
 * Requires: OPENAI_API_KEY + SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY (via ragService → supabaseAdmin)
 */

import { requireApiKey, getOptionalApiKey } from '../utils/loadEnv';

// Require OpenAI key for embeddings
requireApiKey('OPENAI_API_KEY');

import { ragService } from '../../src/services/rag';
import type { RAGResult, RAGTransformation } from '../../src/services/rag/types';

// ============================================================================
// TEST DATA
// ============================================================================

const TEST_FRAGMENTS = [
  {
    content: 'The fluorescent lights of the lab hummed as I pipetted my thousandth sample. Three months of failed experiments had taught me more about perseverance than any textbook.',
    essayType: 'common_app',
    dimension: 'reflection_meaning',
    qualityTier: 'excellent' as const,
    technique: 'show_dont_tell',
    whyItWorks: 'Opens with concrete sensory detail that grounds the reader in the moment before revealing the deeper lesson',
    transferablePrinciple: 'Use physical environment to anchor abstract insights — readers connect to places before ideas',
    sourceInfo: 'test-seed-1',
  },
  {
    content: 'I reorganized our food bank distribution from alphabetical to neighborhood clusters, cutting wait times from 90 minutes to 25 and serving 40% more families per session.',
    essayType: 'common_app',
    dimension: 'evidence_impact',
    qualityTier: 'excellent' as const,
    technique: 'add_evidence',
    whyItWorks: 'Specific metrics (90→25 min, 40% increase) make the impact tangible and verifiable',
    transferablePrinciple: 'Quantify before-and-after to make your contribution undeniable',
    sourceInfo: 'test-seed-2',
  },
  {
    content: 'When my grandmother forgot my name for the first time, I stopped mid-sentence. The kitchen clock ticked. I realized I had been studying neuroscience to prepare for this exact moment.',
    essayType: 'common_app',
    dimension: 'narrative_arc_stakes',
    qualityTier: 'excellent' as const,
    technique: 'add_stakes',
    whyItWorks: 'Personal stakes make the academic pursuit feel urgent and authentic — this is not resume padding',
    transferablePrinciple: 'Connect academic interests to personal stakes that make your "why" self-evident',
    sourceInfo: 'test-seed-3',
  },
  {
    content: 'My code crashed at 2 AM the night before the hackathon demo. Instead of panicking, I noticed the bug revealed a pattern I had been trying to solve for weeks.',
    essayType: 'activity',
    dimension: 'voice_integrity',
    qualityTier: 'strong' as const,
    technique: 'strengthen_voice',
    whyItWorks: 'Authentic voice shines through the specific detail of 2 AM and the unexpected reframe from panic to discovery',
    transferablePrinciple: 'Show your unique way of processing setbacks — that IS your voice',
    sourceInfo: 'test-seed-4',
  },
  {
    content: 'Teaching debate to middle schoolers forced me to explain what I took for granted: why evidence matters, why structure convinces, why the other side deserves genuine engagement.',
    essayType: 'common_app',
    dimension: 'reflection_meaning',
    qualityTier: 'excellent' as const,
    technique: 'clarify_learning',
    whyItWorks: 'Teaching others reveals self-knowledge — the student discovered their own values through the act of explaining',
    transferablePrinciple: 'Describe what you taught to reveal what you learned about yourself',
    sourceInfo: 'test-seed-5',
  },
  {
    content: 'Our recycling initiative diverted 2,300 pounds of waste from landfill in its first semester. But the real metric was the 15 families who asked how to start composting at home.',
    essayType: 'activity',
    dimension: 'evidence_impact',
    qualityTier: 'excellent' as const,
    technique: 'add_evidence',
    whyItWorks: 'Pivots from impressive quantitative metric to a qualitative impact that reveals deeper influence',
    transferablePrinciple: 'Lead with impressive numbers, then pivot to the human impact that numbers cannot capture',
    sourceInfo: 'test-seed-6',
  },
  {
    content: 'I did not start the robotics club because I loved robots. I started it because three freshmen asked me questions nobody else would answer.',
    essayType: 'common_app',
    dimension: 'initiative_leadership',
    qualityTier: 'excellent' as const,
    technique: 'strengthen_voice',
    whyItWorks: 'Subverts expectations about motivation — leadership born from responsiveness, not ambition',
    transferablePrinciple: 'Show unexpected origins of leadership to distinguish yourself from "resume leaders"',
    sourceInfo: 'test-seed-7',
  },
  {
    content: 'The violin strings cut into my fingers during my first orchestra rehearsal. Four years later, those calluses became my most honest autobiography.',
    essayType: 'common_app',
    dimension: 'craft_language_quality',
    qualityTier: 'excellent' as const,
    technique: 'show_dont_tell',
    whyItWorks: 'Physical detail (calluses) serves as metaphor for dedication without stating it explicitly',
    transferablePrinciple: 'Let physical evidence tell the story of commitment — bodies remember what essays forget',
    sourceInfo: 'test-seed-8',
  },
  {
    content: 'Between shifts at the restaurant and AP study sessions, I found 20 minutes each night to write code. That constraint taught me to value every line.',
    essayType: 'activity',
    dimension: 'time_investment_consistency',
    qualityTier: 'strong' as const,
    technique: 'make_concrete',
    whyItWorks: 'Specific time (20 minutes) between specific obligations shows authentic commitment under real constraints',
    transferablePrinciple: 'Name the constraints and the exact time carved out — scarcity amplifies dedication',
    sourceInfo: 'test-seed-9',
  },
  {
    content: 'I presented my climate research to the city council. Three members took notes. One asked me to email the data. That was the moment I realized science needs advocates.',
    essayType: 'common_app',
    dimension: 'transformative_impact',
    qualityTier: 'excellent' as const,
    technique: 'expand_moment',
    whyItWorks: 'Slows down to capture the precise details of a pivotal moment — council members taking notes signals real impact',
    transferablePrinciple: 'Zoom into the moment when something changed — name the witnesses, their reactions, and what you realized',
    sourceInfo: 'test-seed-10',
  },
];

const TEST_TRANSFORMATIONS = [
  {
    beforeText: 'I helped organize community service events',
    afterText: 'I coordinated 12 Saturday builds for Habitat for Humanity, recruiting 45 volunteers and raising $3,200 in material donations',
    dimension: 'evidence_impact',
    technique: 'make_concrete',
    whyItWorks: 'Replaces vague verb (helped organize) with specific actions, numbers, and scope',
    principle: 'Every vague claim can be replaced by who/what/when/how many',
    sourceInfo: 'test-transform-1',
  },
  {
    beforeText: 'I learned a lot from my research experience',
    afterText: 'Debugging 47 failed PCR reactions taught me that scientific progress looks like crossed-out hypotheses in a lab notebook',
    dimension: 'reflection_meaning',
    technique: 'clarify_learning',
    whyItWorks: 'Converts generic learning claim into a specific, visual insight grounded in real lab experience',
    principle: 'Replace "I learned" with the exact moment and mechanism of learning',
    sourceInfo: 'test-transform-2',
  },
  {
    beforeText: 'Being captain was a great leadership experience',
    afterText: 'As captain, I noticed our weakest swimmer always stood at the back during drills. I moved warm-ups to a circle format so nobody had a "back row"',
    dimension: 'initiative_leadership',
    technique: 'show_dont_tell',
    whyItWorks: 'Shows a specific micro-decision that reveals leadership philosophy without claiming it',
    principle: 'Leadership is shown through specific decisions, not through the title',
    sourceInfo: 'test-transform-3',
  },
  {
    beforeText: 'I am passionate about environmental science',
    afterText: 'I spent three summers collecting water samples from the same creek, tracking nitrate levels that told the story of our county\'s fertilizer runoff',
    dimension: 'voice_integrity',
    technique: 'strengthen_voice',
    whyItWorks: 'Replaces self-reported passion with evidence of sustained, specific action',
    principle: 'Passion is proven by what you do repeatedly, not by what you claim to feel',
    sourceInfo: 'test-transform-4',
  },
  {
    beforeText: 'My project had a significant impact on the community',
    afterText: 'After our app launched, the local food pantry reported a 60% drop in expired-food waste. Three neighboring towns asked for the source code.',
    dimension: 'transformative_impact',
    technique: 'add_evidence',
    whyItWorks: 'Third-party validation (food pantry reporting, towns requesting code) is more credible than self-assessed impact',
    principle: 'Let others quantify your impact — external validation outweighs self-assessment',
    sourceInfo: 'test-transform-5',
  },
];

// ============================================================================
// TEST RUNNER
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  details: string;
}

async function runTests(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════════');
  console.log('  RAG Retrieval E2E Test');
  console.log('═══════════════════════════════════════════════════════════\n');

  const results: TestResult[] = [];

  // STEP 1: Seed test data
  console.log('Step 1: Seeding test fragments and transformations...\n');

  const fragmentIds: string[] = [];
  const transformationIds: string[] = [];

  try {
    for (const fragment of TEST_FRAGMENTS) {
      const id = await ragService.addFragment(fragment);
      fragmentIds.push(id);
    }
    console.log(`  ✅ Seeded ${fragmentIds.length} fragments`);

    for (const transform of TEST_TRANSFORMATIONS) {
      const id = await ragService.addTransformation(transform);
      transformationIds.push(id);
    }
    console.log(`  ✅ Seeded ${transformationIds.length} transformations\n`);
  } catch (error) {
    console.error('  ❌ Seeding failed:', error instanceof Error ? error.message : error);
    console.log('\nTest aborted — cannot proceed without seeded data.');
    process.exit(1);
  }

  // STEP 2: Run retrieval queries
  // NOTE: OpenAI text-embedding-3-small produces cosine similarities in the 0.25-0.55
  // range for semantically related content. The default ragService threshold of 0.5 is
  // appropriate for unfiltered queries but too strict for dimension-filtered queries
  // (fewer candidates → lower top similarity). We use 0.2 for filtered queries.
  console.log('Step 2: Running retrieval queries...\n');

  const FILTERED_THRESHOLD = 0.2; // Realistic for filtered pgvector queries

  // Query 1: By dimension — reflection_meaning
  try {
    const results1 = await ragService.retrieveExamples('learning from failure and growth through perseverance', {
      dimension: 'reflection_meaning',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    const hasRelevant = results1.some(r => r.dimension === 'reflection_meaning');
    results.push({
      name: 'Q1: Dimension filter (reflection_meaning)',
      passed: results1.length > 0 && hasRelevant,
      details: `${results1.length} results, relevant=${hasRelevant}, top similarity=${results1[0]?.similarityScore?.toFixed(3) ?? 'N/A'}`,
    });
  } catch (e) {
    results.push({ name: 'Q1: Dimension filter (reflection_meaning)', passed: false, details: `Error: ${e}` });
  }

  // Query 2: By dimension — specificity_evidence (matches seeder data)
  try {
    const results2 = await ragService.retrieveExamples('quantifiable results metrics and specific evidence of impact', {
      dimension: 'specificity_evidence',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    const hasRelevant = results2.some(r => r.dimension === 'specificity_evidence');
    results.push({
      name: 'Q2: Dimension filter (specificity_evidence)',
      passed: results2.length > 0 && hasRelevant,
      details: `${results2.length} results, relevant=${hasRelevant}`,
    });
  } catch (e) {
    results.push({ name: 'Q2: Dimension filter (specificity_evidence)', passed: false, details: `Error: ${e}` });
  }

  // Query 3: By dimension — narrative_arc_stakes
  try {
    const results3 = await ragService.retrieveExamples('personal stakes and connection to academic interest', {
      dimension: 'narrative_arc_stakes',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    results.push({
      name: 'Q3: Dimension filter (narrative_arc_stakes)',
      passed: results3.length > 0,
      details: `${results3.length} results`,
    });
  } catch (e) {
    results.push({ name: 'Q3: Dimension filter (narrative_arc_stakes)', passed: false, details: `Error: ${e}` });
  }

  // Query 4: By dimension — initiative_leadership
  try {
    const results4 = await ragService.retrieveExamples('starting a new club or initiative from scratch', {
      dimension: 'initiative_leadership',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    results.push({
      name: 'Q4: Dimension filter (initiative_leadership)',
      passed: results4.length > 0,
      details: `${results4.length} results`,
    });
  } catch (e) {
    results.push({ name: 'Q4: Dimension filter (initiative_leadership)', passed: false, details: `Error: ${e}` });
  }

  // Query 5: By dimension — craft_language_quality
  try {
    const results5 = await ragService.retrieveExamples('metaphor and physical imagery in writing calluses violin', {
      dimension: 'craft_language_quality',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    results.push({
      name: 'Q5: Dimension filter (craft_language_quality)',
      passed: results5.length > 0,
      details: `${results5.length} results`,
    });
  } catch (e) {
    results.push({ name: 'Q5: Dimension filter (craft_language_quality)', passed: false, details: `Error: ${e}` });
  }

  // Query 6: By technique — show_dont_tell (test seeded data)
  try {
    const results6 = await ragService.retrieveTransformations('show dont tell sensory details instead of stating', {
      technique: 'show_dont_tell',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    const hasTechnique = results6.some(r => r.technique === 'show_dont_tell');
    results.push({
      name: 'Q6: Technique filter (show_dont_tell)',
      passed: results6.length > 0 && hasTechnique,
      details: `${results6.length} results, technique match=${hasTechnique}`,
    });
  } catch (e) {
    results.push({ name: 'Q6: Technique filter (show_dont_tell)', passed: false, details: `Error: ${e}` });
  }

  // Query 7: By technique — make_concrete (test seeded data)
  try {
    const results7 = await ragService.retrieveTransformations('vague language needs specific concrete details who what when', {
      technique: 'make_concrete',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    results.push({
      name: 'Q7: Technique filter (make_concrete)',
      passed: results7.length > 0,
      details: `${results7.length} results`,
    });
  } catch (e) {
    results.push({ name: 'Q7: Technique filter (make_concrete)', passed: false, details: `Error: ${e}` });
  }

  // Query 8: By technique — add_evidence (test seeded data)
  try {
    const results8 = await ragService.retrieveTransformations('adding numbers proof metrics to show real impact', {
      technique: 'add_evidence',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    results.push({
      name: 'Q8: Technique filter (add_evidence)',
      passed: results8.length > 0,
      details: `${results8.length} results`,
    });
  } catch (e) {
    results.push({ name: 'Q8: Technique filter (add_evidence)', passed: false, details: `Error: ${e}` });
  }

  // Query 9: Cross-filter — dimension + essay type
  try {
    const results9 = await ragService.retrieveExamples('personal growth through challenge and self-discovery', {
      dimension: 'reflection_meaning',
      essayType: 'common_app',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    const allCommonApp = results9.every(r => !r.essayType || r.essayType === 'common_app');
    results.push({
      name: 'Q9: Cross-filter (dimension + essayType)',
      passed: results9.length > 0 && allCommonApp,
      details: `${results9.length} results, all common_app=${allCommonApp}`,
    });
  } catch (e) {
    results.push({ name: 'Q9: Cross-filter (dimension + essayType)', passed: false, details: `Error: ${e}` });
  }

  // Query 10: Cross-filter — quality tier + dimension
  try {
    const results10 = await ragService.retrieveExamples('strong leadership in community starting clubs', {
      qualityTier: 'excellent',
      dimension: 'initiative_leadership',
      limit: 3,
      minSimilarity: FILTERED_THRESHOLD,
    });
    const allExcellent = results10.every(r => r.qualityTier === 'excellent');
    results.push({
      name: 'Q10: Cross-filter (qualityTier + dimension)',
      passed: results10.length > 0 && allExcellent,
      details: `${results10.length} results, all excellent=${allExcellent}`,
    });
  } catch (e) {
    results.push({ name: 'Q10: Cross-filter (qualityTier + dimension)', passed: false, details: `Error: ${e}` });
  }

  // STEP 3: Verify formatForPrompt quality
  console.log('\nStep 3: Verifying formatForPrompt quality...\n');

  try {
    const exampleResults = await ragService.retrieveExamples('learning and growth', { limit: 3, minSimilarity: FILTERED_THRESHOLD });
    const formatted = ragService.formatForPrompt(exampleResults);
    const estimatedTokens = formatted.split(/\s+/).length * 1.3; // rough estimate
    const hasCopiedPhrase = checkForLongCopy(exampleResults, formatted);
    results.push({
      name: 'Format: Token budget',
      passed: estimatedTokens < 400, // ~300 tokens target, 400 generous limit
      details: `~${Math.round(estimatedTokens)} estimated tokens`,
    });
    results.push({
      name: 'Format: No copied phrases >8 words',
      passed: !hasCopiedPhrase,
      details: hasCopiedPhrase ? 'Found copied phrase' : 'No copied phrases found',
    });
  } catch (e) {
    results.push({ name: 'Format checks', passed: false, details: `Error: ${e}` });
  }

  // STEP 4: Verify diversity enforcement
  console.log('Step 4: Verifying diversity enforcement...\n');

  try {
    const diverseResults = await ragService.retrieveExamples('essay writing techniques', { limit: 5, minSimilarity: FILTERED_THRESHOLD });
    if (diverseResults.length >= 2) {
      // Check pairwise similarity
      const contents = diverseResults.map(r => r.content);
      let maxPairwise = 0;
      for (let i = 0; i < contents.length; i++) {
        for (let j = i + 1; j < contents.length; j++) {
          const sim = jaccardSimilarity(contents[i], contents[j]);
          maxPairwise = Math.max(maxPairwise, sim);
        }
      }
      results.push({
        name: 'Diversity: Pairwise < 0.85',
        passed: maxPairwise < 0.85,
        details: `Max pairwise similarity: ${maxPairwise.toFixed(3)}`,
      });
    }
  } catch (e) {
    results.push({ name: 'Diversity check', passed: false, details: `Error: ${e}` });
  }

  // STEP 5: Print results
  console.log('\n═══════════════════════════════════════════════════════════');
  console.log('  RESULTS');
  console.log('═══════════════════════════════════════════════════════════\n');

  let passed = 0;
  for (const result of results) {
    const icon = result.passed ? '✅' : '❌';
    console.log(`  ${icon} ${result.name}`);
    console.log(`     ${result.details}`);
    if (result.passed) passed++;
  }

  const queryPassed = results.filter(r => r.name.startsWith('Q') && r.passed).length;
  const queryTotal = results.filter(r => r.name.startsWith('Q')).length;

  console.log(`\n  Total: ${passed}/${results.length} passed`);
  console.log(`  Query retrieval: ${queryPassed}/${queryTotal} (need 8/10)`);
  console.log(`\n  ${queryPassed >= 8 ? '✅ PASS' : '❌ FAIL'} — RAG Retrieval E2E`);

  // Cleanup: remove test data
  console.log('\n  Cleaning up test data...');
  try {
    const { supabaseAdmin } = await import('../../src/supabase/admin');
    if (fragmentIds.length > 0) {
      await supabaseAdmin.from('rag_essay_fragments').delete().in('id', fragmentIds);
    }
    if (transformationIds.length > 0) {
      await supabaseAdmin.from('rag_transformations').delete().in('id', transformationIds);
    }
    console.log('  ✅ Test data cleaned up');
  } catch (e) {
    console.warn('  ⚠️  Cleanup failed (non-critical):', e);
  }

  if (queryPassed < 8) {
    process.exit(1);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

function checkForLongCopy(results: RAGResult[], formatted: string): boolean {
  for (const r of results) {
    const words = r.content.split(/\s+/);
    for (let i = 0; i <= words.length - 9; i++) {
      const phrase = words.slice(i, i + 9).join(' ');
      if (formatted.includes(phrase)) return true;
    }
  }
  return false;
}

function jaccardSimilarity(a: string, b: string): number {
  const getWordTrigrams = (text: string): Set<string> => {
    const words = text.toLowerCase().split(/\s+/).filter(Boolean);
    const trigrams = new Set<string>();
    for (let i = 0; i <= words.length - 3; i++) {
      trigrams.add(`${words[i]} ${words[i + 1]} ${words[i + 2]}`);
    }
    return trigrams;
  };
  const trigramsA = getWordTrigrams(a);
  const trigramsB = getWordTrigrams(b);
  if (trigramsA.size === 0 || trigramsB.size === 0) return 0;
  let intersection = 0;
  for (const t of trigramsA) {
    if (trigramsB.has(t)) intersection++;
  }
  const union = trigramsA.size + trigramsB.size - intersection;
  return union === 0 ? 0 : intersection / union;
}

// RUN
runTests().catch(err => {
  console.error('Test runner failed:', err);
  process.exit(1);
});
