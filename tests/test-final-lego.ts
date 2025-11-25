/**
 * FINAL END-TO-END DEMO: LEGO ESSAY
 *
 * Showcases the complete surgical workshop pipeline with the new Experience Fingerprinting system.
 * This test demonstrates all analysis stages and outputs for stakeholder review.
 */

import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';

// ============================================================================
// LEGO ESSAY (Real student essay)
// ============================================================================

const SAMPLE_ESSAY = `I was always captivated by puzzles throughout my life. When I was about seven years old, I would regularly challenge myself with lego sets for ages fourteen years and up or the 1000 piece puzzle sets. When those sets became too straightforward to me, I pushed the boundaries. The three-dimensional Lego Ninjago set I received for my eighth birthday quickly became an intergalactic spacecraft with the addition of a few more pieces and my young imagination. As I matured, I lost interest in toys, eventually stashing my whole realm of imagination and inventiveness in the pathetic environment of my garage. However, my passion for problem solving and puzzles lingered and I discovered a new platform full of sophistication: the internet.

I continued to expand my capabilities with the possibilities that the web had to offer. All the limitless functionality that computers possessed got me enthralled with modern technology. I soon fell in love with Computer Science and coding which I would consider as the "legos" for young adults. Similar to each block in a lego set, each line of code that goes into a program serves a role in making sure the structure of the program is sound.

In freshman year of high school, I was tasked with constructing a website which required several functions like different pages and buttons in HTML. I had not possessed the best knowledge of HTML yet, but an endless flow of ideas surged through my mind. After brainstorming for a couple of hours, I decided I was going to make a shoe-selling website because of my interest in sneakers. Throughout the whole process of creating this website, I encountered many incidences of syntax errors and code malfunctions. However, the obstacles didn't seize my creativity from taking hold of me. I believe inventiveness is a must have quality in the field of Computer Science because there's not strictly one way to solve a problem. Having successfully finished the website and receiving 100% for my grade, I was confident there would be much more I can accomplish in the future when I let`;

const PROMPT_TEXT = "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.";

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runFullDemo() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  FINAL END-TO-END DEMO: LEGO ESSAY WITH EXPERIENCE FINGERPRINT');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found.');
    return;
  }

  const input: NarrativeEssayInput = {
    essayText: SAMPLE_ESSAY,
    essayType: 'uc_piq',
    promptText: PROMPT_TEXT
  };

  const result = await runSurgicalWorkshop(input);

  // ========================================================================
  // OUTPUT SECTION 1: OVERALL QUALITY ASSESSMENT
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  1. OVERALL QUALITY ASSESSMENT                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Essay Quality Index (EQI): ${result.overallScore}/100`);
  console.log(`Analysis ID: ${result.analysisId}`);
  console.log(`Target Tier: ${getTargetTier(result.overallScore)}`);
  console.log(`Performance: ${result.performanceMetrics.totalMs}ms total`);

  // ========================================================================
  // OUTPUT SECTION 2: 13-DIMENSION RUBRIC BREAKDOWN
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  2. RUBRIC SCORES (13 DIMENSIONS)                               ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  // Convert dimension_scores array to object for easier access
  const dims: Record<string, any> = {};
  result.rubricResult.dimension_scores.forEach(dim => {
    dims[dim.dimension_name] = dim;
  });

  console.log('NARRATIVE CRAFT:');
  console.log(`  • Opening Power:         ${dims['Opening Power']?.final_score || 0}/10 ${getScoreEmoji(dims['Opening Power']?.final_score || 0)}`);
  console.log(`  • Show, Don't Tell:      ${dims['Show, Don\'t Tell']?.final_score || 0}/10 ${getScoreEmoji(dims['Show, Don\'t Tell']?.final_score || 0)}`);
  console.log(`  • Narrative Arc:         ${dims['Narrative Arc']?.final_score || 0}/10 ${getScoreEmoji(dims['Narrative Arc']?.final_score || 0)}`);
  console.log(`  • Sentence Craft:        ${dims['Sentence Craft']?.final_score || 0}/10 ${getScoreEmoji(dims['Sentence Craft']?.final_score || 0)}\n`);

  console.log('SUBSTANTIVE CONTENT:');
  console.log(`  • Character Interiority: ${dims['Character Interiority']?.final_score || 0}/10 ${getScoreEmoji(dims['Character Interiority']?.final_score || 0)}`);
  console.log(`  • Reflection/Meaning:    ${dims['Reflection and Meaning-Making']?.final_score || 0}/10 ${getScoreEmoji(dims['Reflection and Meaning-Making']?.final_score || 0)}`);
  console.log(`  • Context/Constraints:   ${dims['Context and Constraints']?.final_score || 0}/10 ${getScoreEmoji(dims['Context and Constraints']?.final_score || 0)}`);
  console.log(`  • Dialogue/Action:       ${dims['Dialogue and Action']?.final_score || 0}/10 ${getScoreEmoji(dims['Dialogue and Action']?.final_score || 0)}\n`);

  console.log('AUTHENTICITY & DEPTH:');
  console.log(`  • Originality/Voice:     ${dims['Originality and Voice']?.final_score || 0}/10 ${getScoreEmoji(dims['Originality and Voice']?.final_score || 0)}`);
  console.log(`  • Structure/Pacing:      ${dims['Structure and Pacing']?.final_score || 0}/10 ${getScoreEmoji(dims['Structure and Pacing']?.final_score || 0)}`);
  console.log(`  • School Fit:            ${dims['School Fit']?.final_score || 0}/10 ${getScoreEmoji(dims['School Fit']?.final_score || 0)}`);
  console.log(`  • Ethical Grounding:     ${dims['Ethical Grounding/Humility']?.final_score || 0}/10 ${getScoreEmoji(dims['Ethical Grounding/Humility']?.final_score || 0)}\n`);

  // ========================================================================
  // OUTPUT SECTION 3: VOICE FINGERPRINT
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  3. VOICE FINGERPRINT (STUDENT IDENTITY)                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const voice = result.voiceFingerprint;
  console.log('SENTENCE STRUCTURE:');
  console.log(`  • Pattern: ${voice.sentenceStructure?.pattern || 'N/A'}`);
  console.log(`  • Example: "${voice.sentenceStructure?.example || 'N/A'}"\n`);

  console.log('VOCABULARY:');
  console.log(`  • Level: ${voice.vocabulary?.level || 'N/A'}`);
  console.log(`  • Signature Words: ${voice.vocabulary?.signatureWords?.join(', ') || 'N/A'}\n`);

  console.log('PACING:');
  console.log(`  • Speed: ${voice.pacing?.speed || 'N/A'}`);
  console.log(`  • Rhythm: ${voice.pacing?.rhythm || 'N/A'}\n`);

  console.log('TONE:');
  console.log(`  • Primary: ${voice.tone?.primary || 'N/A'}`);
  console.log(`  • Secondary: ${voice.tone?.secondary || 'N/A'}\n`);

  // ========================================================================
  // OUTPUT SECTION 4: EXPERIENCE FINGERPRINT (NEW!)
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  4. EXPERIENCE FINGERPRINT (WHAT\'S UNIQUE & IRREPLACEABLE)      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const exp = result.experienceFingerprint;

  if (exp) {
    console.log('UNIQUENESS DIMENSIONS:\n');

    if (exp.unusualCircumstance) {
      console.log('  🔍 UNUSUAL CIRCUMSTANCE:');
      console.log(`     Description: ${exp.unusualCircumstance.description}`);
      console.log(`     Why It Matters: ${exp.unusualCircumstance.whyItMatters}`);
      console.log(`     Specific Detail: "${exp.unusualCircumstance.specificDetail}"\n`);
    }

    if (exp.unexpectedEmotion) {
      console.log('  😮 UNEXPECTED EMOTION:');
      console.log(`     Emotion: ${exp.unexpectedEmotion.emotion}`);
      console.log(`     Trigger: ${exp.unexpectedEmotion.trigger}`);
      console.log(`     Counter-Expectation: ${exp.unexpectedEmotion.counterExpectation}\n`);
    }

    if (exp.contraryInsight) {
      console.log('  💡 CONTRARY INSIGHT:');
      console.log(`     Insight: ${exp.contraryInsight.insight}`);
      console.log(`     Against What: ${exp.contraryInsight.againstWhat}`);
      console.log(`     Why Authentic: ${exp.contraryInsight.whyAuthentic}\n`);
    }

    if (exp.specificSensoryAnchor) {
      console.log('  👁️  SENSORY ANCHOR:');
      console.log(`     Sensory: ${exp.specificSensoryAnchor.sensory}`);
      console.log(`     Context: ${exp.specificSensoryAnchor.context}`);
      console.log(`     Emotional Weight: ${exp.specificSensoryAnchor.emotionalWeight}\n`);
    }

    if (exp.uniqueRelationship) {
      console.log('  👥 UNIQUE RELATIONSHIP:');
      console.log(`     Person: ${exp.uniqueRelationship.person}`);
      console.log(`     Dynamic: ${exp.uniqueRelationship.dynamic}`);
      console.log(`     Unexpected Aspect: ${exp.uniqueRelationship.unexpectedAspect}\n`);
    }

    if (exp.culturalSpecificity) {
      console.log('  🌍 CULTURAL SPECIFICITY:');
      console.log(`     Element: ${exp.culturalSpecificity.element}`);
      console.log(`     Connection: ${exp.culturalSpecificity.connection}`);
      console.log(`     Universal Bridge: ${exp.culturalSpecificity.universalBridge}\n`);
    }

    console.log('ANTI-PATTERN DETECTION:\n');
    const flags = exp.antiPatternFlags;
    console.log(`  • Follows Typical Arc: ${flags?.followsTypicalArc ? '⚠️  YES' : '✅ NO'}`);
    console.log(`  • Has Generic Insight: ${flags?.hasGenericInsight ? '⚠️  YES' : '✅ NO'}`);
    console.log(`  • Has Manufactured Beat: ${flags?.hasManufacturedBeat ? '⚠️  YES' : '✅ NO'}`);
    console.log(`  • Has Crowd-Pleaser: ${flags?.hasCrowdPleaser ? '⚠️  YES' : '✅ NO'}\n`);

    if (flags?.warnings && flags.warnings.length > 0) {
      console.log('  ⚠️  WARNINGS:');
      flags.warnings.forEach((w: string) => console.log(`     - ${w}`));
      console.log();
    }

    console.log('DIVERGENCE REQUIREMENTS:\n');
    const div = exp.divergenceRequirements;
    if (div) {
      console.log('  MUST INCLUDE:');
      div.mustInclude?.forEach((item: string) => console.log(`     • ${item}`));
      console.log('\n  MUST AVOID:');
      div.mustAvoid?.forEach((item: string) => console.log(`     • ${item}`));
      console.log(`\n  UNIQUE ANGLE: ${div.uniqueAngle}`);
      console.log(`  AUTHENTIC TENSION: ${div.authenticTension}\n`);
    }

    if (exp.qualityAnchors && exp.qualityAnchors.length > 0) {
      console.log('QUALITY ANCHORS (PRESERVE THESE):\n');
      exp.qualityAnchors.forEach((anchor: any, i: number) => {
        console.log(`  ${i + 1}. "${anchor.sentence}"`);
        console.log(`     Why: ${anchor.whyItWorks}`);
        console.log(`     Priority: ${anchor.preservationPriority}\n`);
      });
    }

    console.log(`CONFIDENCE SCORE: ${exp.confidenceScore}/10`);
  } else {
    console.log('  ⚠️  No experience fingerprint extracted.\n');
  }

  // ========================================================================
  // OUTPUT SECTION 5: WORKSHOP ITEMS (SURGICAL FIXES)
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  5. WORKSHOP ITEMS (PRIORITIZED IMPROVEMENTS)                   ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  if (result.workshopItems.length === 0) {
    console.log('  ✨ No critical issues detected! Essay is already strong.\n');
  } else {
    result.workshopItems.forEach((item, i) => {
      console.log(`─────────────────────────────────────────────────────────────────`);
      console.log(`ISSUE ${i + 1}: ${item.problem}`);
      console.log(`─────────────────────────────────────────────────────────────────`);
      console.log(`Severity: ${item.severity.toUpperCase()}`);
      console.log(`Category: ${item.rubric_category}\n`);

      console.log(`WHY IT MATTERS:`);
      console.log(`${item.why_it_matters}\n`);

      console.log(`ORIGINAL TEXT:`);
      console.log(`"${item.quote}"\n`);

      if (item.suggestions && item.suggestions.length > 0) {
        console.log(`SUGGESTIONS:\n`);
        item.suggestions.forEach((sug, j) => {
          console.log(`  Option ${j + 1} [${sug.type}]:`);
          console.log(`  "${sug.text}"\n`);
          console.log(`  Why it works: ${sug.rationale}\n`);
        });
      }

      console.log();
    });
  }

  // ========================================================================
  // OUTPUT SECTION 6: PERFORMANCE METRICS
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  6. PERFORMANCE METRICS                                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const stages = result.performanceMetrics.stages;
  console.log(`Total Time: ${result.performanceMetrics.totalMs}ms\n`);
  console.log('Stage Breakdown:');
  Object.entries(stages).forEach(([stage, ms]) => {
    console.log(`  • ${stage.padEnd(25)}: ${ms}ms`);
  });

  // ========================================================================
  // SAVE TO FILE FOR REVIEW
  // ========================================================================

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  SAVING DETAILED OUTPUT TO FILE...');
  console.log('═══════════════════════════════════════════════════════════════\n');

  const output = {
    metadata: {
      testName: 'Final Lego Essay Demo',
      timestamp: new Date().toISOString(),
      essayWordCount: SAMPLE_ESSAY.split(/\s+/).length,
      systemVersion: 'Phase 17 - Experience Fingerprinting'
    },
    essay: {
      prompt: PROMPT_TEXT,
      text: SAMPLE_ESSAY
    },
    results: {
      overallScore: result.overallScore,
      targetTier: getTargetTier(result.overallScore),
      rubricBreakdown: result.rubricResult.dimension_scores,
      voiceFingerprint: result.voiceFingerprint,
      experienceFingerprint: result.experienceFingerprint,
      workshopItems: result.workshopItems,
      performanceMetrics: result.performanceMetrics,
      rubricFlags: result.rubricResult.flags,
      rubricAssessment: result.rubricResult.assessment
    }
  };

  await fs.writeFile(
    'TEST_OUTPUT_FINAL_LEGO.json',
    JSON.stringify(output, null, 2),
    'utf-8'
  );

  console.log('✅ Full output saved to: TEST_OUTPUT_FINAL_LEGO.json');

  // Generate markdown report
  const markdown = generateMarkdownReport(output);
  await fs.writeFile(
    'TEST_OUTPUT_FINAL_LEGO.md',
    markdown,
    'utf-8'
  );

  console.log('✅ Markdown report saved to: TEST_OUTPUT_FINAL_LEGO.md');

  console.log('\n═══════════════════════════════════════════════════════════════');
  console.log('  DEMO COMPLETE - Ready for stakeholder review');
  console.log('═══════════════════════════════════════════════════════════════\n');
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

function getTargetTier(score: number): string {
  if (score >= 90) return 'Elite (Stanford/MIT/Harvard)';
  if (score >= 80) return 'Strong (UC Berkeley/UCLA)';
  if (score >= 70) return 'Good (UC Davis/UCSD)';
  if (score >= 60) return 'Developing';
  return 'Needs Work';
}

function getScoreEmoji(score: number): string {
  if (score >= 9) return '🌟';
  if (score >= 8) return '✨';
  if (score >= 7) return '👍';
  if (score >= 6) return '📈';
  return '⚠️';
}

function generateMarkdownReport(output: any): string {
  const { results } = output;

  let md = `# Surgical Workshop Demo: Lego Essay\n\n`;
  md += `**Generated:** ${output.metadata.timestamp}\n`;
  md += `**System Version:** ${output.metadata.systemVersion}\n`;
  md += `**Word Count:** ${output.metadata.essayWordCount}\n\n`;

  md += `---\n\n`;

  md += `## Overall Assessment\n\n`;
  md += `- **EQI Score:** ${results.overallScore}/100\n`;
  md += `- **Target Tier:** ${results.targetTier}\n`;
  md += `- **Total Processing Time:** ${results.performanceMetrics.totalMs}ms\n\n`;

  md += `---\n\n`;

  md += `## Rubric Breakdown (12 Dimensions)\n\n`;

  // Convert dimension_scores array to object
  const dimsObj: Record<string, any> = {};
  results.rubricBreakdown.forEach((dim: any) => {
    dimsObj[dim.dimension_name] = dim;
  });

  md += `| Dimension | Raw | Final | Evidence |\n`;
  md += `|-----------|-----|-------|----------|\n`;

  results.rubricBreakdown.forEach((dim: any) => {
    const evidence = dim.evidence?.justification || 'N/A';
    md += `| ${dim.dimension_name} | ${dim.raw_score}/10 | ${dim.final_score}/10 | ${evidence} |\n`;
  });
  md += `\n`;

  md += `---\n\n`;

  md += `## Experience Fingerprint (Anti-Convergence System)\n\n`;
  const exp = results.experienceFingerprint;

  if (exp) {
    md += `### Uniqueness Dimensions\n\n`;

    if (exp.unusualCircumstance) {
      md += `**Unusual Circumstance:**\n`;
      md += `- Description: ${exp.unusualCircumstance.description}\n`;
      md += `- Why It Matters: ${exp.unusualCircumstance.whyItMatters}\n`;
      md += `- Specific Detail: "${exp.unusualCircumstance.specificDetail}"\n\n`;
    }

    if (exp.contraryInsight) {
      md += `**Contrary Insight:**\n`;
      md += `- Insight: ${exp.contraryInsight.insight}\n`;
      md += `- Against What: ${exp.contraryInsight.againstWhat}\n`;
      md += `- Why Authentic: ${exp.contraryInsight.whyAuthentic}\n\n`;
    }

    md += `### Anti-Pattern Detection\n\n`;
    const flags = exp.antiPatternFlags;
    md += `- Follows Typical Arc: ${flags?.followsTypicalArc ? '⚠️ YES' : '✅ NO'}\n`;
    md += `- Has Generic Insight: ${flags?.hasGenericInsight ? '⚠️ YES' : '✅ NO'}\n`;
    md += `- Has Manufactured Beat: ${flags?.hasManufacturedBeat ? '⚠️ YES' : '✅ NO'}\n`;
    md += `- Has Crowd-Pleaser: ${flags?.hasCrowdPleaser ? '⚠️ YES' : '✅ NO'}\n\n`;

    if (exp.divergenceRequirements) {
      md += `### Divergence Constraints\n\n`;
      md += `**Must Include:**\n`;
      exp.divergenceRequirements.mustInclude?.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n**Must Avoid:**\n`;
      exp.divergenceRequirements.mustAvoid?.forEach((item: string) => {
        md += `- ${item}\n`;
      });
      md += `\n**Unique Angle:** ${exp.divergenceRequirements.uniqueAngle}\n`;
      md += `**Authentic Tension:** ${exp.divergenceRequirements.authenticTension}\n\n`;
    }
  }

  md += `---\n\n`;

  md += `## Workshop Items\n\n`;
  if (results.workshopItems.length === 0) {
    md += `✨ No critical issues detected! Essay is already strong.\n\n`;
  } else {
    results.workshopItems.forEach((item: any, i: number) => {
      md += `### Issue ${i + 1}: ${item.problem}\n\n`;
      md += `- **Severity:** ${item.severity}\n`;
      md += `- **Category:** ${item.rubric_category}\n\n`;
      md += `**Why It Matters:**\n${item.why_it_matters}\n\n`;
      md += `**Original Text:**\n> ${item.quote}\n\n`;

      if (item.suggestions && item.suggestions.length > 0) {
        md += `**Suggestions:**\n\n`;
        item.suggestions.forEach((sug: any, j: number) => {
          md += `${j + 1}. **[${sug.type}]** "${sug.text}"\n`;
          md += `   - *Why it works:* ${sug.rationale}\n\n`;
        });
      }
    });
  }

  return md;
}

// ============================================================================
// RUN THE DEMO
// ============================================================================

runFullDemo().catch(console.error);




