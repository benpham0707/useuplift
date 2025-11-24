/**
 * TEST: Teaching-Focused Feedback (Item 2 v2)
 *
 * Demonstrates the enhanced feedback system that TEACHES, not just TELLS.
 * Shows encouraging, motivating, caring tone with in-depth analysis.
 */

import { enrichAllWithTeaching } from '../src/services/unified/feedbackEnricher_v2_teaching';
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
  console.log('  ITEM 2 V2: TEACHING-FOCUSED FEEDBACK DEMONSTRATION');
  console.log('  "We teach, we don\'t just tell"');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Enrich with teaching-focused feedback
  const enriched = enrichAllWithTeaching(MOCK_DIMENSION_SCORES, LEGO_ESSAY);

  // Display each dimension
  for (const dim of enriched) {
    const feedback = dim.teaching_feedback;

    console.log('\n╔════════════════════════════════════════════════════════════════╗');
    console.log(`║  ${dim.dimension_name.toUpperCase().padEnd(62, ' ')}║`);
    console.log(`║  Score: ${dim.final_score}/10${' '.repeat(52)}║`);
    console.log('╚════════════════════════════════════════════════════════════════╝\n');

    // ========================================================================
    // OPENING STORY
    // ========================================================================
    console.log('📖 OPENING:\n');
    console.log(wrapText(feedback.opening_story, 65));
    console.log('\n');

    // ========================================================================
    // CELEBRATING STRENGTHS
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('✅ WHAT YOU\'RE DOING WELL\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(wrapText(feedback.what_youre_doing_well.summary, 65));
    console.log('\n');

    feedback.what_youre_doing_well.detailed_observations.forEach((obs, idx) => {
      console.log(`${idx + 1}. ${obs.strength}\n`);
      console.log(`   💡 Why This Matters:`);
      console.log(wrapText(obs.why_this_matters, 62, '      '));
      console.log('\n');
      console.log(`   📝 Evidence: "${obs.evidence_from_essay.substring(0, 80)}..."\n`);
      console.log(`   🌟 Encouragement:`);
      console.log(wrapText(obs.encouragement, 62, '      '));
      console.log('\n');
    });

    // ========================================================================
    // SCORE CONTEXT
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('🎯 YOUR SCORE IN CONTEXT\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(`📊 Your Score: ${feedback.score_context.your_score}/10\n`);
    console.log(wrapText(feedback.score_context.percentile_story, 65));
    console.log('\n');
    console.log(wrapText(feedback.score_context.competitive_landscape, 65));
    console.log('\n');
    console.log(wrapText(feedback.score_context.what_this_means_for_you, 65));
    console.log('\n');
    console.log(`✨ The Good News:`);
    console.log(wrapText(feedback.score_context.the_good_news, 65));
    console.log('\n');

    // ========================================================================
    // TIER JOURNEY
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('📈 UNDERSTANDING THE TIERS (Your Journey)\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(`🔹 Current: ${feedback.tier_journey.current_tier_name}\n`);
    console.log(wrapText(feedback.tier_journey.current_tier_explained, 65));
    console.log('\n');
    console.log(wrapText(feedback.tier_journey.what_got_you_here, 65));
    console.log('\n');

    console.log(`🔸 Next: ${feedback.tier_journey.next_tier_name}\n`);
    console.log(wrapText(feedback.tier_journey.next_tier_explained, 65));
    console.log('\n');

    console.log('🌉 Bridging the Gap:\n');
    console.log(wrapText(feedback.tier_journey.the_gap, 65));
    console.log('\n');

    console.log('📚 How to Cross:');
    feedback.tier_journey.how_to_cross_the_gap.forEach((step, idx) => {
      console.log(`\n  ${idx + 1}. ${step.step}`);
      console.log(`     Why: ${step.why_this_works.substring(0, 150)}...`);
      console.log(`     Example: ${step.example.substring(0, 150)}...`);
    });
    console.log('\n');

    // ========================================================================
    // GROWTH OPPORTUNITIES
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('🎯 OPPORTUNITIES FOR GROWTH\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(wrapText(feedback.growth_opportunities.headline, 65));
    console.log('\n');

    feedback.growth_opportunities.detailed_analysis.forEach((opp, idx) => {
      console.log(`${idx + 1}. ${opp.opportunity}\n`);

      console.log(`   💡 Why This Matters:`);
      console.log(wrapText(opp.why_this_matters, 62, '      '));
      console.log('\n');

      console.log(`   👀 What Readers Experience:`);
      console.log(wrapText(opp.what_readers_experience, 62, '      '));
      console.log('\n');

      console.log(`   🛠️  How to Improve:`);
      console.log(wrapText(opp.how_to_improve, 62, '      '));
      console.log('\n');

      if (opp.example_transformation) {
        console.log(`   ✨ Example Transformation:`);
        console.log(wrapText(opp.example_transformation, 62, '      '));
        console.log('\n');
      }
    });

    // ========================================================================
    // PERSONALIZED ROADMAP
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('🗺️  YOUR PERSONALIZED ROADMAP\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(wrapText(feedback.personalized_roadmap.looking_at_your_essay, 65));
    console.log('\n');

    console.log('What We Notice:');
    feedback.personalized_roadmap.what_we_notice.forEach(notice => {
      console.log(`  • ${notice}`);
    });
    console.log('\n');

    const next = feedback.personalized_roadmap.your_next_concrete_step;
    console.log('🎯 Your Next Concrete Step:\n');
    console.log(`The Challenge: ${next.the_challenge}\n`);
    console.log(`Why Tackle This First:`);
    console.log(wrapText(next.why_tackle_this_first, 65));
    console.log('\n');
    console.log(`Exactly How:`);
    console.log(wrapText(next.exactly_how, 65));
    console.log('\n');
    console.log(`What Success Looks Like:`);
    console.log(wrapText(next.what_success_looks_like, 65));
    console.log('\n');

    console.log('🔮 Looking Ahead:\n');
    console.log(wrapText(feedback.personalized_roadmap.looking_ahead, 65));
    console.log('\n');

    // ========================================================================
    // CLOSING
    // ========================================================================
    console.log('─────────────────────────────────────────────────────────────');
    console.log('💪 CLOSING MESSAGE\n');
    console.log('─────────────────────────────────────────────────────────────\n');

    console.log(wrapText(feedback.closing_message, 65));
    console.log('\n\n');
  }

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  WHAT MAKES THIS "TEACHING-FOCUSED"                            ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log('✅ We EXPLAIN, not just evaluate:');
  console.log('   - Why each dimension matters');
  console.log('   - How readers experience their writing');
  console.log('   - What principles underlie good writing\n');

  console.log('✅ We ENCOURAGE and MOTIVATE:');
  console.log('   - Celebrate specific strengths in detail');
  console.log('   - Frame issues as opportunities for growth');
  console.log('   - Maintain caring, supportive tone throughout\n');

  console.log('✅ We provide DEPTH and LENGTH:');
  console.log('   - Detailed observations with examples');
  console.log('   - Multiple paragraphs per section');
  console.log('   - Storytelling to make concepts memorable\n');

  console.log('✅ We help them SEE from reader\'s POV:');
  console.log('   - "What readers experience when..."');
  console.log('   - Before/after transformations');
  console.log('   - Concrete examples of principles\n');

  console.log('✅ We give STEP-BY-STEP guidance:');
  console.log('   - Exactly how to approach revisions');
  console.log('   - Prioritization (what to tackle first)');
  console.log('   - What success looks like\n');

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ ITEM 2 V2 COMPLETE: Teaching-focused feedback that truly');
  console.log('     educates, encourages, and empowers students');
  console.log('═══════════════════════════════════════════════════════════════\n');

  // Save results
  await fs.writeFile(
    'ITEM_2_TEACHING_FEEDBACK_DEMO.json',
    JSON.stringify(enriched, null, 2)
  );

  console.log('💾 Full results saved to: ITEM_2_TEACHING_FEEDBACK_DEMO.json\n');
}

// Helper function to wrap text
function wrapText(text: string, width: number, indent: string = ''): string {
  const words = text.split(' ');
  const lines: string[] = [];
  let currentLine = indent;

  for (const word of words) {
    if (currentLine.length + word.length + 1 <= width + indent.length) {
      currentLine += (currentLine === indent ? '' : ' ') + word;
    } else {
      lines.push(currentLine);
      currentLine = indent + word;
    }
  }

  if (currentLine.length > indent.length) {
    lines.push(currentLine);
  }

  return lines.join('\n');
}

runTest().catch(console.error);
