/**
 * Complete Citation System Test
 *
 * Tests the full flow:
 * 1. Detect citation triggers in feedback
 * 2. Select appropriate citations
 * 3. Attach citations to text
 * 4. Display formatted output
 */

import { CitationTriggerDetector } from '../src/services/commonAppWorkshop/services/citationTriggerDetector';
import { CitationAttacher, attachCitationsToFeedback } from '../src/services/commonAppWorkshop/services/citationAttacher';

// ============================================================================
// TEST SCENARIO: Student with CLASS_BASED_ONLY Issue
// ============================================================================

console.log('='.repeat(80));
console.log('CITATION SYSTEM TEST: Complete End-to-End Flow');
console.log('='.repeat(80));
console.log();

// ----------------------------------------------------------------------------
// STEP 1: Original Feedback (NO CITATIONS YET)
// ----------------------------------------------------------------------------

console.log('STEP 1: Original Feedback (before citation system)');
console.log('-'.repeat(80));

const originalFeedback = {
  problem:
    'Your essay focuses only on what you learned in AP Biology class. Stanford wants to see learning that goes beyond the classroom.',

  why_matters:
    "Stanford weighs Intellectual Vitality at 40%—their highest priority. Dean Shaw said: 'We want students who pursue learning for its own sake.'",

  how_to_fix:
    "Add an example of learning you pursued outside of class. This shows self-directed curiosity (Stanford's #1 priority).",
};

console.log('Problem:', originalFeedback.problem);
console.log('Why Matters:', originalFeedback.why_matters);
console.log('How to Fix:', originalFeedback.how_to_fix);
console.log();

// ----------------------------------------------------------------------------
// STEP 2: Detect Citation Triggers
// ----------------------------------------------------------------------------

console.log('STEP 2: Detecting Citation Triggers');
console.log('-'.repeat(80));

const detector = new CitationTriggerDetector();

const triggers = detector.detectTriggers(originalFeedback, {
  college_id: 'stanford',
  issue_type: 'CLASS_BASED_ONLY',
  severity: 'critical',
});

console.log(`Found ${triggers.length} citation triggers:\n`);

triggers.forEach((trigger, index) => {
  console.log(`Trigger ${index + 1}:`);
  console.log(`  Type: ${trigger.type}`);
  console.log(`  Location: ${trigger.location}`);
  console.log(`  Anchor Text: "${trigger.anchor_text}"`);
  console.log(`  Context:`, trigger.context);
  console.log();
});

// ----------------------------------------------------------------------------
// STEP 3: Attach Citations
// ----------------------------------------------------------------------------

console.log('STEP 3: Attaching Citations to Feedback');
console.log('-'.repeat(80));

const feedbackWithCitations = attachCitationsToFeedback(originalFeedback, {
  college_id: 'stanford',
  essay_type: 'intellectual_vitality',
  issue_type: 'CLASS_BASED_ONLY',
  severity: 'critical',
});

console.log('Feedback with citations:\n');
console.log('Problem:', feedbackWithCitations.problem);
console.log('Why Matters:', feedbackWithCitations.why_matters);
console.log('How to Fix:', feedbackWithCitations.how_to_fix);
console.log();

console.log(`Total citations attached: ${Object.keys(feedbackWithCitations.citations).length}`);
console.log();

// ----------------------------------------------------------------------------
// STEP 4: Display Citation Details
// ----------------------------------------------------------------------------

console.log('STEP 4: Citation Display Data (What Student Sees)');
console.log('-'.repeat(80));

Object.entries(feedbackWithCitations.citations).forEach(([num, citationData]) => {
  console.log(`\n${'='.repeat(70)}`);
  console.log(`CITATION #${num}`);
  console.log('='.repeat(70));

  console.log('\n📱 HOVER PREVIEW (shows on hover):');
  console.log(citationData.hover_preview);

  console.log('\n▼ LEVEL 1: SIMPLE (default expanded view)');
  console.log(citationData.expandable.simple);

  console.log('\n▼ LEVEL 2: MEDIUM (click to expand)');
  console.log(citationData.expandable.medium);

  console.log('\n▼ LEVEL 3: DETAILED (click "Show full research")');
  console.log(citationData.expandable.detailed);

  console.log('\n📊 METADATA:');
  console.log(`  Relevance Score: ${citationData.citation.relevance.score}/100`);
  console.log(`  Use For: ${citationData.citation.relevance.use_for}`);
  console.log(`  Reason: ${citationData.citation.relevance.reason}`);
  console.log(`  Source Type: ${citationData.citation.citation.type}`);
  if (citationData.citation.citation.author) {
    console.log(`  Author: ${citationData.citation.citation.author}`);
  }
  console.log();
});

// ============================================================================
// TEST 2: MULTIPLE ISSUES (Portfolio View)
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 2: Multiple Issues (Portfolio View)');
console.log('='.repeat(80));
console.log();

const portfolioFeedback = {
  problem: 'Your essay portfolio is unbalanced across Stanford's core values.',

  why_matters:
    "You're spending only 25% on Intellectual Vitality when Stanford weighs it at 40% (their highest priority). Meanwhile, you're over-emphasizing Impact at 30% when Stanford weighs it at 20%.",

  how_to_fix:
    "Rebalance your portfolio to match Stanford's priorities. Add self-directed learning to your IV essay (87% of successful essays do this).",
};

console.log('Original Portfolio Feedback:');
console.log(portfolioFeedback.why_matters);
console.log();

const portfolioCitations = attachCitationsToFeedback(portfolioFeedback, {
  college_id: 'stanford',
  essay_type: 'portfolio',
  severity: 'major',
});

console.log('With Citations:');
console.log(portfolioCitations.why_matters);
console.log();
console.log(`Citations attached: ${Object.keys(portfolioCitations.citations).length}`);
console.log();

// ============================================================================
// TEST 3: COMPARISON VIEW (Stanford vs MIT)
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TEST 3: Comparison View (Stanford vs MIT)');
console.log('='.repeat(80));
console.log();

const comparisonFeedback = {
  problem: 'Your essay emphasizes building things, which works for MIT but not Stanford.',

  why_matters:
    "Stanford weighs Intellectual Vitality at 40% (curiosity-driven), while MIT weighs Hands-On Making at 35% (action-driven). You've written a maker-focused essay that aligns with MIT but misses Stanford's priority.",

  how_to_fix:
    "For Stanford: Lead with WHY you're curious (40% IV weight). For MIT: Lead with WHAT you built (35% Making weight).",
};

console.log('Comparison Feedback:');
console.log(comparisonFeedback.why_matters);
console.log();

const comparisonCitations = attachCitationsToFeedback(comparisonFeedback, {
  college_id: 'stanford',
  essay_type: 'why_major',
  severity: 'major',
});

console.log('With Citations:');
console.log(comparisonCitations.why_matters);
console.log();

// ============================================================================
// SUMMARY STATISTICS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('SUMMARY: Citation System Performance');
console.log('='.repeat(80));
console.log();

const totalTriggers = triggers.length;
const totalCitations = Object.keys(feedbackWithCitations.citations).length;
const triggerTypes = [...new Set(triggers.map((t) => t.type))];

console.log(`✅ Total Triggers Detected: ${totalTriggers}`);
console.log(`✅ Total Citations Attached: ${totalCitations}`);
console.log(`✅ Trigger Types Used: ${triggerTypes.join(', ')}`);
console.log();

console.log('Coverage by Trigger Type:');
const typeCounts: Record<string, number> = {};
triggers.forEach((t) => {
  typeCounts[t.type] = (typeCounts[t.type] || 0) + 1;
});

Object.entries(typeCounts).forEach(([type, count]) => {
  console.log(`  - ${type}: ${count}`);
});
console.log();

// ============================================================================
// VALIDATION
// ============================================================================

console.log('VALIDATION CHECKS:');
console.log('-'.repeat(80));

const checks = [
  {
    name: 'Weight claims detected',
    pass: triggers.some((t) => t.type === 'weight_claim'),
  },
  {
    name: 'Citations attached to text',
    pass: feedbackWithCitations.why_matters.includes('<sup>'),
  },
  {
    name: 'Hover previews generated',
    pass: Object.values(feedbackWithCitations.citations).every((c) => c.hover_preview),
  },
  {
    name: '3-level explanations present',
    pass: Object.values(feedbackWithCitations.citations).every(
      (c) => c.expandable.simple && c.expandable.medium && c.expandable.detailed
    ),
  },
  {
    name: 'Relevance scores calculated',
    pass: Object.values(feedbackWithCitations.citations).every(
      (c) => c.citation.relevance.score > 0
    ),
  },
];

checks.forEach((check) => {
  const status = check.pass ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${check.name}`);
});

const allPassed = checks.every((c) => c.pass);
console.log();
console.log(allPassed ? '🎉 All validation checks passed!' : '⚠️  Some checks failed');
console.log();

// ============================================================================
// EXAMPLE OUTPUT FOR FRONTEND
// ============================================================================

console.log('='.repeat(80));
console.log('EXAMPLE: Frontend Display Format (JSON)');
console.log('='.repeat(80));
console.log();

const frontendFormat = {
  feedback: {
    problem: feedbackWithCitations.problem,
    why_matters: feedbackWithCitations.why_matters,
    how_to_fix: feedbackWithCitations.how_to_fix,
  },

  citations: Object.fromEntries(
    Object.entries(feedbackWithCitations.citations).map(([num, data]) => [
      num,
      {
        number: data.number,
        hover: data.hover_preview,
        simple: data.expandable.simple,
        medium: data.expandable.medium,
        detailed: data.expandable.detailed,
        metadata: {
          relevance: data.citation.relevance.score,
          source_type: data.citation.citation.type,
          author: data.citation.citation.author,
        },
      },
    ])
  ),
};

console.log(JSON.stringify(frontendFormat, null, 2));
console.log();

console.log('='.repeat(80));
console.log('TEST COMPLETE ✅');
console.log('='.repeat(80));
