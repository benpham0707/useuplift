/**
 * END-TO-END TEST: Piano/Coding Creative Expression Essay
 *
 * Tests the complete surgical workshop pipeline with Item 1 improvements
 * (enhanced suggestions) on a new essay about music and coding.
 */

import 'dotenv/config';
import { runSurgicalWorkshop } from '../src/services/narrativeWorkshop/surgicalOrchestrator';
import { NarrativeEssayInput } from '../src/services/narrativeWorkshop/types';
import fs from 'fs/promises';

// ============================================================================
// PIANO/CODING ESSAY
// ============================================================================

const PIANO_ESSAY = `From the moment my fingers first danced across the piano keys, I was captivated by the power to create worlds through sound. With just seven notes, I could weave melodies that tell stories, evoke emotions, and connect deeply with others. Music became my language—a blend of expression and analytical thinking that challenged me to innovate within rhythm and harmony's constraints.

Composing is like solving a puzzle; each note and chord must align perfectly to convey the intended emotion. I spent hours experimenting with chord progressions, fascinated by how minor adjustments transformed a piece's mood. It wasn't just about creating something new but expressing a part of myself through each composition.

Reimagining classical pieces by infusing modern elements became my favorite endeavor. Inspired by Chopin's Nocturnes, I blended them with contemporary jazz rhythms to create a fusion honoring tradition while embracing innovation.

Delving deeper into music, I noticed parallels with another interest: coding. Just as I used notes and chords to compose, I could use code to create projects—both requiring logic layered with creativity. Coding became another medium to build and innovate, transforming abstract ideas into tangible experiences.

Practicing scales mirrors debugging code; both demand patience and attention to detail. Composing taught me to anticipate how elements interact—a skill invaluable when integrating software components. This connection crystallized when I developed an artificially intelligent disc jockey that generated tracks tailored to users' moods. Seeing users smile as the AI DJ captured their emotions reaffirmed my belief in the connection between technology and human emotion.

My musical background guided me in creating an emotionally resonant AI DJ. Integrating AI with user preferences was like composing a song harmonizing with its audience. Fine-tuning the AI to interpret subtle cues required innovative solutions blending musical intuition with technical expertise.

Whether at a piano or a computer, I'm driven to create and explore the limitless possibilities at my fingertips. Music opened my mind to the beauty of innovation and coding extends that passion. I look forward to continuing this journey, crafting experiences that resonate with others and make a meaningful difference—much like composing a timeless melody.`;

const PROMPT_TEXT = "Every person has a creative side, and it can be expressed in many ways: problem solving, original and innovative thinking, and artistically, to name a few. Describe how you express your creative side.";

// ============================================================================
// MAIN TEST EXECUTION
// ============================================================================

async function runFullTest() {
  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  END-TO-END TEST: PIANO/CODING CREATIVE EXPRESSION ESSAY');
  console.log('  Testing Item 1 Enhancements (Brilliant Suggestions)');
  console.log('═══════════════════════════════════════════════════════════════\n');

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ No ANTHROPIC_API_KEY found.');
    return;
  }

  const input: NarrativeEssayInput = {
    essayText: PIANO_ESSAY,
    essayType: 'uc_piq',
    promptText: PROMPT_TEXT
  };

  console.log('📝 Essay Length:', PIANO_ESSAY.split(/\s+/).length, 'words\n');
  console.log('⏳ Running complete analysis...\n');

  const startTime = Date.now();
  const result = await runSurgicalWorkshop(input);
  const totalTime = Date.now() - startTime;

  // ========================================================================
  // OUTPUT: OVERALL QUALITY ASSESSMENT
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  OVERALL QUALITY ASSESSMENT                                     ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`📊 Essay Quality Index (EQI): ${result.overallScore}/100`);
  console.log(`🎯 Target Tier: ${getTargetTier(result.overallScore)}`);
  console.log(`⏱️  Processing Time: ${totalTime}ms\n`);

  // ========================================================================
  // OUTPUT: RUBRIC SCORES
  // ========================================================================

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  RUBRIC SCORES (13 DIMENSIONS)                                  ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const dims: Record<string, any> = {};
  result.rubricResult.dimension_scores.forEach(dim => {
    dims[dim.dimension_name] = dim;
  });

  console.log('NARRATIVE CRAFT:');
  Object.keys(dims).slice(0, 4).forEach(key => {
    const dim = dims[key];
    console.log(`  • ${dim.dimension_name.padEnd(25)}: ${dim.final_score}/10 ${getScoreEmoji(dim.final_score)}`);
  });

  console.log('\nCONTENT & DEPTH:');
  Object.keys(dims).slice(4, 8).forEach(key => {
    const dim = dims[key];
    console.log(`  • ${dim.dimension_name.padEnd(25)}: ${dim.final_score}/10 ${getScoreEmoji(dim.final_score)}`);
  });

  console.log('\nAUTHENTICITY:');
  Object.keys(dims).slice(8).forEach(key => {
    const dim = dims[key];
    console.log(`  • ${dim.dimension_name.padEnd(25)}: ${dim.final_score}/10 ${getScoreEmoji(dim.final_score)}`);
  });

  // ========================================================================
  // OUTPUT: WORKSHOP SUGGESTIONS (Item 1 Enhanced)
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  SURGICAL WORKSHOP SUGGESTIONS (Item 1 Enhanced)                ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  console.log(`Found ${result.workshopItems.length} opportunities for refinement\n`);

  result.workshopItems.slice(0, 3).forEach((item, idx) => {
    console.log(`─────────────────────────────────────────────────────────────`);
    console.log(`Issue ${idx + 1}: ${item.problem}`);
    console.log(`─────────────────────────────────────────────────────────────\n`);

    console.log(`📊 Category: ${item.rubric_category}`);
    console.log(`⚠️  Severity: ${item.severity}\n`);

    if (item.quote) {
      console.log(`📍 Location: "${item.quote.substring(0, 80)}..."\n`);
    }
    console.log(`🔍 Why It Matters: ${item.why_it_matters}\n`);

    // Show all 3 suggestions
    item.suggestions.forEach((sugg, suggIdx) => {
      console.log(`Option ${suggIdx + 1} [${sugg.type}]:`);
      console.log(`  "${sugg.text.substring(0, 120)}${sugg.text.length > 120 ? '...' : ''}"\n`);

      if (sugg.rationale) {
        console.log(`  💡 Why: ${sugg.rationale.substring(0, 150)}${sugg.rationale.length > 150 ? '...' : ''}\n`);
      }

      const scoreImpact = (sugg as any).score_impact;
      if (scoreImpact) {
        console.log(`  📈 Score Impact: ${scoreImpact.substring(0, 100)}${scoreImpact.length > 100 ? '...' : ''}\n`);
      }
    });
  });

  if (result.workshopItems.length > 3) {
    console.log(`\n... and ${result.workshopItems.length - 3} more suggestions\n`);
  }

  // ========================================================================
  // OUTPUT: VOICE FINGERPRINT
  // ========================================================================

  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║  VOICE FINGERPRINT                                              ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  const voice = result.voiceFingerprint;
  console.log(`Tone: ${voice.tone}`);
  console.log(`Cadence: ${voice.cadence}`);
  console.log(`Markers: ${voice.markers.slice(0, 3).join(', ')}\n`);

  console.log('Sample Sentences:');
  voice.sampleSentences.slice(0, 2).forEach((sample: string) => {
    console.log(`  • "${sample}"`);
  });

  // ========================================================================
  // QUALITY CHECK: Are suggestions brilliant?
  // ========================================================================

  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║  QUALITY CHECK: Suggestion Brilliance (Item 1 Validation)      ║');
  console.log('╚════════════════════════════════════════════════════════════════╝\n');

  let brilliantCount = 0;
  let totalSuggestions = 0;

  result.workshopItems.forEach(item => {
    item.suggestions.forEach(sugg => {
      totalSuggestions++;

      // Check for brilliance indicators
      const hasSensoryDetails = /\b(saw|heard|felt|touched|smell|taste|look|sound|stared|watched|noticed)\b/i.test(sugg.text);
      const hasConcreteNumbers = /\d+/.test(sugg.text);
      const hasSpecificObjects = /\b(piano|key|chord|note|code|screen|cursor|line|button)\b/i.test(sugg.text);
      const avoidAbstraction = !/\b(passion|journey|experience|feeling|emotion)\b(?![s,])/i.test(sugg.text) || hasSensoryDetails;

      const brillianceScore =
        (hasSensoryDetails ? 1 : 0) +
        (hasConcreteNumbers ? 1 : 0) +
        (hasSpecificObjects ? 1 : 0) +
        (avoidAbstraction ? 1 : 0);

      if (brillianceScore >= 2) {
        brilliantCount++;
      }
    });
  });

  const brillianceRate = Math.round((brilliantCount / totalSuggestions) * 100);

  console.log(`Suggestions Analyzed: ${totalSuggestions}`);
  console.log(`Brilliant Suggestions: ${brilliantCount} (${brillianceRate}%)`);
  console.log(`\n${brillianceRate >= 80 ? '✅' : '⚠️'} Target: ≥80% brilliant (Item 1 goal)\n`);

  if (brillianceRate >= 80) {
    console.log('🎉 SUCCESS: Item 1 enhancements are working! Suggestions are consistently brilliant.\n');
  } else {
    console.log('⚠️  Note: Some suggestions could be more concrete. Review for abstract language.\n');
  }

  // ========================================================================
  // SAVE RESULTS
  // ========================================================================

  const outputData = {
    metadata: {
      testName: 'Piano/Coding Creative Expression Essay',
      timestamp: new Date().toISOString(),
      essayWordCount: PIANO_ESSAY.split(/\s+/).length,
      systemVersion: 'Phase 17.5 - Item 1 Enhanced'
    },
    essay: {
      prompt: PROMPT_TEXT,
      text: PIANO_ESSAY
    },
    results: {
      overallScore: result.overallScore,
      targetTier: getTargetTier(result.overallScore),
      rubricBreakdown: result.rubricResult.dimension_scores.map(d => ({
        dimension_name: d.dimension_name,
        raw_score: d.raw_score,
        final_score: d.final_score,
        weighted_score: d.weighted_score,
        evidence: d.evidence
      })),
      workshopSuggestions: result.workshopItems.map(item => ({
        rubric_category: item.rubric_category,
        severity: item.severity,
        quote: item.quote,
        problem: item.problem,
        why_it_matters: item.why_it_matters,
        suggestions: item.suggestions.map(s => ({
          text: s.text,
          rationale: s.rationale,
          type: s.type,
          score_impact: (s as any).score_impact
        }))
      })),
      experienceFingerprint: result.experienceFingerprint,
      voiceFingerprint: voice,
      qualityMetrics: {
        totalSuggestions,
        brilliantSuggestions: brilliantCount,
        brillianceRate: `${brillianceRate}%`
      }
    },
    performanceMetrics: {
      totalMs: totalTime,
      stages: result.performanceMetrics.stages
    }
  };

  await fs.writeFile(
    'TEST_OUTPUT_PIANO_ESSAY.json',
    JSON.stringify(outputData, null, 2)
  );

  await fs.writeFile(
    'TEST_OUTPUT_PIANO_ESSAY.md',
    generateMarkdownReport(outputData)
  );

  console.log('═══════════════════════════════════════════════════════════════');
  console.log('  ✅ TEST COMPLETE');
  console.log('═══════════════════════════════════════════════════════════════\n');
  console.log('📄 Results saved to:');
  console.log('   • TEST_OUTPUT_PIANO_ESSAY.json');
  console.log('   • TEST_OUTPUT_PIANO_ESSAY.md\n');
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function getTargetTier(score: number): string {
  if (score >= 80) return '🌟 Elite (Harvard/Stanford)';
  if (score >= 70) return '🎯 Strong (Top UC competitive)';
  if (score >= 60) return '📈 Competent (Solid foundation)';
  if (score >= 50) return '🔧 Needs Work';
  return '🚧 Significant Gaps';
}

function getScoreEmoji(score: number): string {
  if (score >= 8.5) return '🌟';
  if (score >= 7) return '✅';
  if (score >= 5.5) return '📈';
  if (score >= 4) return '⚠️';
  return '🔧';
}

function generateMarkdownReport(data: any): string {
  let report = `# Piano/Coding Creative Expression Essay - Analysis Report\n\n`;
  report += `**Generated:** ${data.metadata.timestamp}\n`;
  report += `**System Version:** ${data.metadata.systemVersion}\n\n`;

  report += `## Overall Assessment\n\n`;
  report += `- **EQI Score:** ${data.results.overallScore}/100\n`;
  report += `- **Target Tier:** ${data.results.targetTier}\n`;
  report += `- **Processing Time:** ${data.performanceMetrics.totalMs}ms\n\n`;

  report += `## Rubric Scores\n\n`;
  data.results.rubricBreakdown.forEach((dim: any) => {
    report += `- **${dim.dimension_name}:** ${dim.final_score}/10\n`;
  });

  // Add Experience Fingerprint section
  if (data.results.experienceFingerprint) {
    const exp = data.results.experienceFingerprint;
    report += `\n---\n\n## Experience Fingerprint (Anti-Convergence System)\n\n`;

    if (exp.uniqueDimensions && exp.uniqueDimensions.length > 0) {
      report += `### Uniqueness Dimensions\n\n`;
      exp.uniqueDimensions.forEach((dim: any) => {
        report += `**${dim.category}:**\n`;
        report += `- Description: ${dim.description}\n`;
        report += `- Why It Matters: ${dim.whyItMatters}\n`;
        report += `- Specific Detail: "${dim.specificDetail}"\n\n`;
      });
    }

    if (exp.antiPatternFlags) {
      report += `### Anti-Pattern Detection\n\n`;
      report += `- Follows Typical Arc: ${exp.antiPatternFlags.followsTypicalArc ? '❌ YES' : '✅ NO'}\n`;
      report += `- Has Generic Insight: ${exp.antiPatternFlags.hasGenericInsight ? '❌ YES' : '✅ NO'}\n`;
      report += `- Has Manufactured Beat: ${exp.antiPatternFlags.hasManufacturedBeat ? '❌ YES' : '✅ NO'}\n`;
      report += `- Has Crowd-Pleaser: ${exp.antiPatternFlags.hasCrowdPleaser ? '❌ YES' : '✅ NO'}\n\n`;
    }

    if (exp.divergenceStrategy) {
      report += `### Divergence Strategy\n\n`;
      const strat = exp.divergenceStrategy;
      report += `**Must Include:**\n`;
      if (strat.mustInclude) {
        strat.mustInclude.forEach((item: string) => {
          report += `- ${item}\n`;
        });
      }
      report += `\n**Must Avoid:**\n`;
      if (strat.mustAvoid) {
        strat.mustAvoid.forEach((item: string) => {
          report += `- ${item}\n`;
        });
      }
      report += `\n`;
      if (strat.uniqueAngle) report += `**Unique Angle:** ${strat.uniqueAngle}\n`;
      if (strat.authenticTension) report += `**Authentic Tension:** ${strat.authenticTension}\n`;
      report += `\n`;
    }
  }

  report += `---\n\n## Workshop Suggestions (${data.results.workshopSuggestions.length} total)\n\n`;
  data.results.workshopSuggestions.slice(0, 5).forEach((item: any, idx: number) => {
    report += `### Issue ${idx + 1}: ${item.problem}\n\n`;
    report += `- **Severity:** ${item.severity}\n`;
    report += `- **Category:** ${item.rubric_category}\n\n`;

    report += `**Why It Matters:**\n${item.why_it_matters}\n\n`;

    if (item.quote) {
      report += `**Original Text:**\n> ${item.quote}\n\n`;
    }

    report += `**Suggestions:**\n\n`;
    item.suggestions.forEach((sugg: any, sIdx: number) => {
      report += `${sIdx + 1}. **[${sugg.type}]** "${sugg.text}"\n`;
      if (sugg.rationale) {
        report += `   - *Why it works:* ${sugg.rationale}\n`;
      }
      if (sugg.score_impact) {
        report += `   - *Score impact:* ${sugg.score_impact}\n`;
      }
      report += `\n`;
    });
  });

  report += `\n## Quality Metrics (Item 1 Validation)\n\n`;
  report += `- **Total Suggestions:** ${data.results.qualityMetrics.totalSuggestions}\n`;
  report += `- **Brilliant Suggestions:** ${data.results.qualityMetrics.brilliantSuggestions}\n`;
  report += `- **Brilliance Rate:** ${data.results.qualityMetrics.brillianceRate}\n`;
  report += `- **Target Achievement:** ${parseInt(data.results.qualityMetrics.brillianceRate) >= 80 ? '✅ SUCCESS' : '⚠️ REVIEW NEEDED'}\n`;

  return report;
}

runFullTest().catch(console.error);
