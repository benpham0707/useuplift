/**
 * TEST: Enhanced Rubric Feedback (Item 2)
 *
 * Demonstrates the before/after improvement in rubric dimension feedback.
 * Shows calibration context, tier navigation, and personalized guidance.
 */

import { enrichAllFeedback } from '../src/services/unified/feedbackEnricher';
import fs from 'fs/promises';

const LEGO_ESSAY = `I was always captivated by puzzles throughout my life. When I was about seven years old, I would regularly challenge myself with lego sets for ages fourteen years and up or the 1000 piece puzzle sets. When those sets became too straightforward to me, I pushed the boundaries. The three-dimensional Lego Ninjago set I received for my eighth birthday quickly became an intergalactic spacecraft with the addition of a few more pieces and my young imagination. As I matured, I lost interest in toys, eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage. However, my passion for problem solving and puzzles lingered and I discovered a new platform full of sophistication: the internet.

I continued to expand my capabilities with the possibilities that the web had to offer. All the limitless functionality that computers possessed got me enthralled with modern technology. I soon fell in love with Computer Science and coding which I would consider as the "legos" for young adults. Similar to each block in a lego set, each line of code that goes into a program serves a role in making sure the structure of the program is sound.

In freshman year of high school, I was tasked with constructing a website which required several functions like different pages and buttons in HTML. I had not possessed the best knowledge of HTML yet, but an endless flow of ideas surged through my mind. After brainstorming for a couple of hours, I decided I was going to make a shoe-selling website because of my interest in sneakers. Throughout the whole process of creating this website, I encountered many incidences of syntax errors and code malfunctions. However, the obstacles didn't seize my creativity from taking hold of me. I believe inventiveness is a must have quality in the field of Computer Science because there's not strictly one way to solve a problem. Having successfully finished the website and receiving 100% for my grade, I was confident there would be much more I can accomplish in the future when I let`;

// Mock dimension scores (from actual test output)
const MOCK_DIMENSION_SCORES = [
  {
    dimension_name: 'opening_power_scene_entry',
    final_score: 4,
    evidence: {
      quotes: [
        "I was always captivated by puzzles throughout my life.",
        "When I was about seven years old, I would regularly challenge myself with lego sets for ages fourteen years and up or the 1000 piece puzzle sets."
      ],
      justification: "The opening starts with a generic statement about being 'captivated by puzzles' which is abstract and predictable. While it quickly moves to a specific age and concrete details about Lego sets, the initial hook lacks power. The essay doesn't drop us into a scene but rather begins with summary exposition. This falls below the baseline of 5 due to the weak opening line.",
      constructive_feedback: "Start with a specific moment in action - perhaps you hunched over a 1000-piece puzzle at age seven, or the moment you first modified that Ninjago set. Drop us into the scene immediately rather than announcing your general interest.",
      anchors_met: []
    }
  },
  {
    dimension_name: 'narrative_arc_stakes_turn',
    final_score: 3.5,
    evidence: {
      quotes: [
        "As I matured, I lost interest in toys, eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage. However, my passion for problem solving and puzzles lingered",
        "Throughout the whole process of creating this website, I encountered many incidences of syntax errors and code malfunctions. However, the obstacles didn't seize my creativity from taking hold of me."
      ],
      justification: "There's an implied problem (losing interest in physical toys, facing coding obstacles) and a soft turn (discovering computer science as a new outlet). The stakes are somewhat present - the risk of losing creativity entirely - but they're not deeply felt. The website project provides some tension with syntax errors, but the resolution feels predictable and the outcome (100% grade) lacks meaningful cost or sacrifice.",
      constructive_feedback: "Develop the tension more fully - what specifically was at stake when your creativity was 'stashed in the garage'? Make us feel the frustration of those syntax errors and the genuine uncertainty about whether you'd succeed.",
      anchors_met: [5]
    }
  },
  {
    dimension_name: 'character_interiority_vulnerability',
    final_score: 3.5,
    evidence: {
      quotes: [
        "eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage",
        "I had not possessed the best knowledge of HTML yet"
      ],
      justification: "The essay shows minimal vulnerability. The phrase about stashing imagination in the 'pathetic environment' of the garage hints at loss, but doesn't explore the emotional impact. The admission of lacking HTML knowledge is surface-level. The essay maintains a largely positive, confident tone throughout without deep introspection or meaningful admission of doubt, fear, or internal conflict.",
      constructive_feedback: "Explore the emotional weight of that transition from physical to digital creativity - what did it feel like to lose that childhood wonder? Share a moment of genuine doubt or frustration during your coding journey.",
      anchors_met: []
    }
  }
];

async function runTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ITEM 2: ENHANCED RUBRIC FEEDBACK DEMONSTRATION');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Enrich the feedback
  const enriched = enrichAllFeedback(
    MOCK_DIMENSION_SCORES,
    LEGO_ESSAY,
    { personalizationLevel: 'high' }
  );

  // Display before/after for each dimension
  for (const dim of enriched) {
    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log(`║  ${dim.dimension_name.toUpperCase().padEnd(62, ' ')}║`);
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    console.log(`📊 SCORE: ${dim.final_score}/10\n`);

    // ========================================================================
    // BEFORE (Current System)
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('BEFORE (Current System):');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log('Evidence Quotes:');
    dim.evidence.quotes.forEach(q => console.log(`  • "${q.substring(0, 80)}${q.length > 80 ? '...' : ''}"`));

    console.log(`\nJustification:\n  ${dim.evidence.justification.substring(0, 200)}${dim.evidence.justification.length > 200 ? '...' : ''}`);

    console.log(`\nConstructive Feedback:\n  ${dim.evidence.constructive_feedback}`);

    // ========================================================================
    // AFTER (Enhanced System)
    // ========================================================================
    console.log('\n─────────────────────────────────────────────────────────────');
    console.log('AFTER (Enhanced System):');
    console.log('─────────────────────────────────────────────────────────────\n');

    const enrichedFeedback = dim.enriched_feedback;

    // Calibration Context
    console.log('🎯 YOUR SCORE IN CONTEXT:');
    console.log(`  • Percentile: ${enrichedFeedback.calibration.percentile}`);
    console.log(`  • Competitive Range: ${enrichedFeedback.calibration.competitive_range}`);
    console.log(`  • What This Means: ${enrichedFeedback.calibration.context_explanation.substring(0, 120)}...`);

    // What Works Well
    console.log('\n✅ WHAT YOU\'RE DOING WELL:');
    enrichedFeedback.strengths.forEach(s => console.log(`  • ${s}`));

    // Opportunities
    console.log('\n🎯 WHERE YOU CAN GROW:');
    enrichedFeedback.opportunities.forEach(o => console.log(`  • ${o.substring(0, 100)}${o.length > 100 ? '...' : ''}`));

    // Tier Navigation
    console.log('\n📈 TIER NAVIGATION:');
    console.log(`  Current: ${enrichedFeedback.tier_navigation.current_tier}`);
    console.log(`  Next: ${enrichedFeedback.tier_navigation.next_tier}`);
    console.log(`\n  To Advance:`);
    enrichedFeedback.tier_navigation.how_to_advance.slice(0, 2).forEach(step =>
      console.log(`    → ${step}`)
    );

    // Next Step
    console.log('\n💡 YOUR PERSONALIZED NEXT STEP:');
    console.log(`  ${enrichedFeedback.next_step.specific_guidance}`);
    if (enrichedFeedback.next_step.essay_example) {
      console.log(`\n  Essay-Specific: ${enrichedFeedback.next_step.essay_example.substring(0, 150)}...`);
    }

    console.log('\n');
  }

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  SUMMARY: WHAT WE ADDED                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ Calibration Context:');
  console.log('   - Percentile placement (where they stand relative to others)');
  console.log('   - Competitive benchmark (what admitted students score)');
  console.log('   - Plain English explanation of what their score means\n');

  console.log('✅ Balanced Feedback:');
  console.log('   - What they\'re doing well (authentic praise)');
  console.log('   - Where they can grow (constructive opportunities)\n');

  console.log('✅ Tier Navigation:');
  console.log('   - Current tier name and description');
  console.log('   - Next tier to reach');
  console.log('   - Specific steps to advance\n');

  console.log('✅ Personalized Guidance:');
  console.log('   - Essay-specific examples from THEIR writing');
  console.log('   - Concrete next steps tailored to their work\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ ITEM 2 COMPLETE: Enhanced feedback provides depth,');
  console.log('     context, and personalized guidance for every dimension');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save results
  await fs.writeFile(
    'ITEM_2_ENHANCED_FEEDBACK_DEMO.json',
    JSON.stringify(enriched, null, 2)
  );

  console.log('💾 Full results saved to: ITEM_2_ENHANCED_FEEDBACK_DEMO.json\n');
}

runTest().catch(console.error);
