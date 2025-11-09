/**
 * Test Coaching Output
 *
 * Tests the coaching system with a weak essay to see all the issues detected
 * and suggested fixes.
 */

import { analyzeEntry } from '../src/core/analysis/engine';
import { ExperienceEntry } from '../src/core/types/experience';
import { v4 as uuidv4 } from 'uuid';
import * as dotenv from 'dotenv';

dotenv.config();

// Weak essay with many issues (should trigger lots of coaching)
const WEAK_ESSAY: ExperienceEntry = {
  id: uuidv4(),
  user_id: uuidv4(),
  title: 'Community Volunteer',
  organization: 'Local Nonprofit',
  role: 'Volunteer',
  category: 'service',
  description_original: `I was passionate about giving back to my community and was thrilled to volunteer at a local nonprofit organization. I was responsible for helping with various tasks and assisting staff members with their important work.

Through this experience, I learned valuable lessons about teamwork, dedication, and the importance of community service. I developed strong interpersonal skills and gained a deeper appreciation for the challenges facing underserved populations. I frequently worked with many people and participated in numerous events.

This opportunity taught me that even small contributions can make a big difference. I am grateful for the chance to have been part of such an impactful team and look forward to continuing my commitment to service in college.`,
  hours_per_week: 2,
  weeks_per_year: 20,
  start_date: '2024-01-01',
  end_date: '2024-05-31',
  time_span: 'January 2024 - May 2024',
  version: 1,
};

// Medium essay with some issues
const MEDIUM_ESSAY: ExperienceEntry = {
  id: uuidv4(),
  user_id: uuidv4(),
  title: 'Debate Club President',
  organization: 'High School Debate Team',
  role: 'President',
  category: 'leadership',
  description_original: `As president of our debate club, I was responsible for organizing weekly meetings and coordinating tournament participation. I worked with our advisor to develop a practice schedule that improved team performance.

During my tenure, club membership grew from 15 to 23 students. I recruited new members through presentations at club fairs and implemented a mentorship program pairing experienced debaters with novices. We attended 6 tournaments and placed in the top 3 at regional competitions.

I also managed our budget of $2,400, organizing fundraisers to cover tournament fees and travel expenses. This experience taught me valuable leadership skills and the importance of effective communication. I learned how to motivate team members and handle conflicts diplomatically.`,
  hours_per_week: 5,
  weeks_per_year: 36,
  start_date: '2023-09-01',
  end_date: '2024-06-15',
  time_span: 'September 2023 - June 2024',
  version: 1,
};

async function main() {
  console.log('\n╔═══════════════════════════════════════════════════════════════╗');
  console.log('║              COACHING OUTPUT TEST                             ║');
  console.log('╚═══════════════════════════════════════════════════════════════╝\n');

  // Test 1: Weak essay (should have many issues)
  console.log('TEST 1: Weak Generic Volunteer Essay\n');
  console.log('─'.repeat(70));

  const weakResult = await analyzeEntry(WEAK_ESSAY, { depth: 'quick', skip_coaching: false });

  if (weakResult.coaching) {
    console.log('\n📊 OVERALL SUMMARY:');
    console.log(`   Score: ${weakResult.coaching.overall.narrative_quality_index}/100`);
    console.log(`   Tier: ${weakResult.coaching.overall.score_tier}`);
    console.log(`   Total Issues: ${weakResult.coaching.overall.total_issues}`);
    console.log(`   Quick Summary: ${weakResult.coaching.overall.quick_summary}\n`);

    console.log('🎯 TOP 3 PRIORITIES:');
    weakResult.coaching.top_priorities.forEach((priority, idx) => {
      console.log(`   ${idx + 1}. [${priority.category}] ${priority.issue_title}`);
      console.log(`      → ${priority.impact}\n`);
    });

    console.log('📝 ALL DETECTED ISSUES BY CATEGORY:\n');

    for (const category of weakResult.coaching.categories) {
      console.log(`\n${'═'.repeat(70)}`);
      console.log(`${category.category_name}: ${category.score}/10`);
      console.log(`Diagnosis: ${category.diagnosis}`);
      console.log(`Issues: ${category.issues_count}`);
      console.log(`${'═'.repeat(70)}\n`);

      for (const issue of category.detected_issues) {
        console.log(`  ⚠️  ${issue.title} [${issue.severity.toUpperCase()}]`);
        console.log(`      From Draft: "${issue.from_draft.substring(0, 80)}..."`);
        console.log(`      Problem: ${issue.problem}`);
        console.log(`      Why It Matters: ${issue.why_matters}\n`);

        console.log(`      Suggested Fixes (${issue.suggested_fixes.length} options):`);
        issue.suggested_fixes.forEach((fix, fixIdx) => {
          console.log(`      ${fixIdx + 1}. ${fix.fix_text}`);
          console.log(`         Why This Works: ${fix.why_this_works}`);
          if (fix.teaching_example) {
            console.log(`         Example: ${fix.teaching_example}`);
          }
          console.log();
        });
      }
    }
  } else {
    console.log('❌ No coaching generated (skip_coaching might be true)');
  }

  console.log('\n\n═══════════════════════════════════════════════════════════════\n');

  // Test 2: Medium essay (fewer issues, more targeted)
  console.log('TEST 2: Medium Debate Club Essay\n');
  console.log('─'.repeat(70));

  await new Promise(resolve => setTimeout(resolve, 2000)); // Rate limiting

  const mediumResult = await analyzeEntry(MEDIUM_ESSAY, { depth: 'quick', skip_coaching: false });

  if (mediumResult.coaching) {
    console.log('\n📊 OVERALL SUMMARY:');
    console.log(`   Score: ${mediumResult.coaching.overall.narrative_quality_index}/100`);
    console.log(`   Tier: ${mediumResult.coaching.overall.score_tier}`);
    console.log(`   Total Issues: ${mediumResult.coaching.overall.total_issues}`);
    console.log(`   Quick Summary: ${mediumResult.coaching.overall.quick_summary}\n`);

    console.log('📝 DETECTED ISSUES:\n');

    for (const category of mediumResult.coaching.categories) {
      console.log(`\n[${category.category_name}] ${category.score}/10 - ${category.issues_count} issue(s)`);

      for (const issue of category.detected_issues) {
        console.log(`  • ${issue.title}: ${issue.problem}`);
        console.log(`    Fix: ${issue.suggested_fixes[0].fix_text}\n`);
      }
    }
  }

  console.log('\n✅ Coaching output test complete!');
  console.log('This structured output maps directly to your UI components.\n');
}

main().catch(console.error);
