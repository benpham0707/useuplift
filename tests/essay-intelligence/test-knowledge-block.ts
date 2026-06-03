import { assembleKnowledgeBlock } from '@/services/essayIntelligence/coaching/coachingKnowledgeBase';
import type { BlockContext } from '@/services/essayIntelligence/coaching/types';

async function test() {
  console.log('=== Knowledge Block Assembly Tests ===\n');

  // Test 1: Common App essay
  const ctx1: BlockContext = { mode: 'first_encounter', phase: 'foundation', essayType: 'common_app' };
  const block1 = await assembleKnowledgeBlock(ctx1);
  const hasPrinciples = block1.includes('WRITING PRINCIPLES');
  const hasPerformative = block1.includes('PERFORMATIVE WRITING');
  const hasBanned = block1.includes('BANNED TERMS');
  console.log(`Test 1: Common App knowledge block`);
  console.log(`  ${hasPrinciples ? '✓' : '✗'} Has writing principles`);
  console.log(`  ${hasPerformative ? '✓' : '✗'} Has performative indicators`);
  console.log(`  ${hasBanned ? '✓' : '✗'} Has banned terms`);
  console.log(`  Length: ${block1.length} chars (~${Math.round(block1.length / 4)} tokens)\n`);

  // Test 2: Supplement essay
  const ctx2: BlockContext = { mode: 'first_encounter', phase: 'foundation', essayType: 'supplement' };
  const block2 = await assembleKnowledgeBlock(ctx2);
  const hasAO = block2.includes("AO'S QUESTION");
  const hasSuccess = block2.includes('SUCCESS CRITERIA');
  const hasCritical = block2.includes('CRITICAL DIMENSIONS');
  const hasExcellence = block2.includes('WHAT MAKES THIS 85');
  console.log(`Test 2: Supplement knowledge block`);
  console.log(`  ${hasAO ? '✓' : '✗'} Has AO reader question`);
  console.log(`  ${hasSuccess ? '✓' : '✗'} Has success criteria`);
  console.log(`  ${hasCritical ? '✓' : '✗'} Has critical dimensions`);
  console.log(`  ${hasExcellence ? '✓' : '✗'} Has excellence requirements`);
  console.log(`  Length: ${block2.length} chars (~${Math.round(block2.length / 4)} tokens)\n`);

  // Test 3: PIQ (should have principles + performative but NO type-specific supplement data)
  const ctx3: BlockContext = { mode: 'first_encounter', phase: 'foundation', essayType: 'piq' };
  const block3 = await assembleKnowledgeBlock(ctx3);
  const piqHasPrinciples = block3.includes('WRITING PRINCIPLES');
  const piqNoTypeSpecific = !block3.includes("AO'S QUESTION");
  console.log(`Test 3: PIQ knowledge block`);
  console.log(`  ${piqHasPrinciples ? '✓' : '✗'} Has writing principles (universal)`);
  console.log(`  ${piqNoTypeSpecific ? '✓' : '✗'} No type-specific supplement data (PIQ uses its own block)`);
  console.log(`  Length: ${block3.length} chars (~${Math.round(block3.length / 4)} tokens)\n`);

  // Test 4: Supplement is larger than Common App (has extra type data)
  const supplementLarger = block2.length > block1.length;
  console.log(`Test 4: Supplement enrichment`);
  console.log(`  ${supplementLarger ? '✓' : '✗'} Supplement block (${block2.length}) > Common App block (${block1.length})\n`);

  const passed = [hasPrinciples, hasPerformative, hasBanned, hasAO, hasSuccess, hasCritical, hasExcellence, piqHasPrinciples, piqNoTypeSpecific, supplementLarger];

  // Test 5: PIQ with full knowledge (vulnerability, word economy, issue patterns)
  const block5 = block3; // PIQ block from ctx3 above (now includes deep PIQ knowledge)
  const hasVulnerability = block5.includes('VULNERABILITY LEVEL COACHING');
  const hasWordEconomy = block5.includes('PIQ 350-WORD ECONOMY');
  const hasCutPriority = block5.includes('CUT PRIORITY');
  const hasIssuePatterns = block5.includes('ISSUE PATTERNS');
  console.log(`Test 5: PIQ deep knowledge`);
  console.log(`  ${hasVulnerability ? '✓' : '✗'} Has 5-level vulnerability coaching`);
  console.log(`  ${hasWordEconomy ? '✓' : '✗'} Has PIQ word economy system`);
  console.log(`  ${hasCutPriority ? '✓' : '✗'} Has cut priority hierarchy`);
  console.log(`  ${hasIssuePatterns ? '✓' : '✗'} Has PIQ issue detection patterns`);
  console.log(`  Length: ${block5.length} chars (~${Math.round(block5.length / 4)} tokens)\n`);

  // Test 6: PIQ block is larger than Common App (has all the extra PIQ knowledge)
  const piqRicher = block5.length > block1.length * 1.3;
  console.log(`Test 6: PIQ enrichment depth`);
  console.log(`  ${piqRicher ? '✓' : '✗'} PIQ block (${block5.length}) >> Common App block (${block1.length})\n`);

  // Test 7: Vulnerability coaching has all 5 levels
  const hasLevel1 = block5.includes('LEVEL 1');
  const hasLevel5 = block5.includes('LEVEL 5');
  console.log(`Test 7: Vulnerability levels`);
  console.log(`  ${hasLevel1 ? '✓' : '✗'} Has Level 1 (Minimal)`);
  console.log(`  ${hasLevel5 ? '✓' : '✗'} Has Level 5 (Transformation Imposed)\n`);

  // Test 8: Common App has issue patterns too
  const caBlock = await assembleKnowledgeBlock({ mode: 'first_encounter', phase: 'foundation', essayType: 'common_app' } as BlockContext);
  const caHasIssues = caBlock.includes('ISSUE PATTERNS');
  console.log(`Test 8: Common App issue patterns`);
  console.log(`  ${caHasIssues ? '✓' : '✗'} Common App has issue patterns\n`);

  const allPassed = [...passed, hasVulnerability, hasWordEconomy, hasCutPriority, hasIssuePatterns, piqRicher, hasLevel1, hasLevel5, caHasIssues];
  const total = allPassed.length;
  const ok = allPassed.filter(Boolean).length;
  console.log(`=== Results: ${ok}/${total} passed ===`);
  if (ok === total) console.log('✅ All knowledge block tests passed');
  else console.log(`❌ ${total - ok} tests failed`);
}

test().catch(console.error);
