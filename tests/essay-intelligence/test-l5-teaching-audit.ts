/**
 * L5 Teaching Quality Audit
 *
 * Runs the FULL pipeline (L1→L5) on the piano essay, captures ALL annotations,
 * and writes a human-readable audit to tests/output/l5-teaching-audit.txt.
 *
 * Then classifies each annotation into:
 *   1. Teaches with causal chain (references essay architecture, explains WHY)
 *   2. Labels with North Star decoration (mentions architecture vaguely)
 *   3. Generic writing advice (could apply to any essay)
 *
 * Also scans for banned phrases from the L5 system prompt.
 */

import '../utils/loadEnv';
import { requireApiKey } from '../utils/loadEnv';

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

import { analysisOrchestrator } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { PipelineInput } from '../../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type { L5Annotation, L5AnnotationResult } from '../../src/services/essayIntelligence/analysis/deepAnnotationService';

// ============================================================================
// CONFIG
// ============================================================================

requireApiKey('ANTHROPIC_API_KEY');

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PIANO_ESSAY_PATH = path.resolve(__dirname, '..', 'fixtures/piano-essay.txt');
const OUTPUT_DIR = path.resolve(__dirname, '..', 'output');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'l5-teaching-audit.txt');

// Banned phrases from the L5 system prompt
const BANNED_PHRASES = [
  'consider adding more sensory detail',
  'show don\'t tell',
  'show, don\'t tell',
  'use stronger verbs',
  'add more specificity',
  'make this more vivid',
  'make it more vivid',
  'vary your sentence structure',
  'strengthen the connection',
  'add more specific detail',
  'add more detail',
];

// Generic advice indicators (softer detection — phrases that signal generic advice)
const GENERIC_INDICATORS = [
  'consider adding',
  'you might want to',
  'try to include',
  'would benefit from',
  'could be stronger',
  'add more',
  'make it more',
  'be more specific',
  'use more vivid',
  'more engaging',
  'more compelling',
  'needs improvement',
  'could improve',
];

// Architecture-grounding indicators (phrases that signal essay-specific teaching)
const ARCHITECTURE_INDICATORS = [
  /P\d+/,                        // References specific paragraph by number
  /paragraph \d/i,                // References specific paragraph
  /through[- ]?line/i,           // References through-line
  /structural role/i,            // References structural role
  /the reader/i,                 // Reader experience framing
  /this paragraph/i,             // Paragraph-specific framing
  /this sentence/i,              // Sentence-specific framing
  /because/i,                    // Causal reasoning
  /in order to/i,                // Purpose framing
  /so that/i,                    // Consequence framing
  /the arc/i,                    // Arc reference
  /fulcrum/i,                    // Structural term
  /bridge/i,                     // Structural term
  /earning/i,                    // Earned-ness reference
  /momentum/i,                   // Flow reference
  /transformation/i,             // Journey reference
  /connection between/i,         // Connection reference
];

// ============================================================================
// CLASSIFICATION
// ============================================================================

type AnnotationQuality = 'teaches_causal_chain' | 'labels_with_decoration' | 'generic_advice';

interface ClassifiedAnnotation {
  annotation: L5Annotation;
  quality: AnnotationQuality;
  reason: string;
  bannedPhrasesFound: string[];
  genericIndicatorsFound: string[];
  architectureIndicatorsFound: string[];
}

function classifyAnnotation(ann: L5Annotation): ClassifiedAnnotation {
  const allText = `${ann.content} ${ann.teachingRationale} ${ann.northStarConnection}`.toLowerCase();

  // Check banned phrases
  const bannedPhrasesFound = BANNED_PHRASES.filter((phrase) =>
    allText.includes(phrase.toLowerCase()),
  );

  // Check generic indicators
  const genericIndicatorsFound = GENERIC_INDICATORS.filter((phrase) =>
    allText.includes(phrase.toLowerCase()),
  );

  // Check architecture indicators
  const architectureIndicatorsFound = ARCHITECTURE_INDICATORS
    .filter((pattern) => pattern.test(allText))
    .map((p) => p.source);

  // Classification logic:
  // 1. If it has banned phrases → generic
  // 2. If it has 3+ architecture indicators AND explains WHY → teaches
  // 3. If it has 1-2 architecture indicators but vague → labels
  // 4. If dominated by generic indicators → generic
  // 5. Default: labels

  let quality: AnnotationQuality;
  let reason: string;

  if (bannedPhrasesFound.length > 0) {
    quality = 'generic_advice';
    reason = `Contains banned phrase(s): ${bannedPhrasesFound.join(', ')}`;
  } else if (
    architectureIndicatorsFound.length >= 3 &&
    genericIndicatorsFound.length === 0 &&
    (allText.includes('because') || allText.includes('in order to') ||
     allText.includes('so that') || allText.includes('which means') ||
     allText.includes('this matters') || allText.includes('the effect'))
  ) {
    quality = 'teaches_causal_chain';
    reason = `Architecture-grounded (${architectureIndicatorsFound.length} refs) with causal reasoning`;
  } else if (architectureIndicatorsFound.length >= 2) {
    // Has some architecture references — check if it's just decoration
    if (genericIndicatorsFound.length >= 2) {
      quality = 'labels_with_decoration';
      reason = `Mixed: ${architectureIndicatorsFound.length} architecture refs but also ${genericIndicatorsFound.length} generic indicators`;
    } else {
      quality = 'teaches_causal_chain';
      reason = `Architecture-grounded (${architectureIndicatorsFound.length} refs) with specific context`;
    }
  } else if (genericIndicatorsFound.length >= 2) {
    quality = 'generic_advice';
    reason = `Dominated by generic indicators: ${genericIndicatorsFound.join(', ')}`;
  } else if (architectureIndicatorsFound.length >= 1) {
    quality = 'labels_with_decoration';
    reason = `Mentions architecture (${architectureIndicatorsFound.length} refs) but lacks causal depth`;
  } else {
    quality = 'labels_with_decoration';
    reason = 'No clear architecture grounding or causal reasoning detected';
  }

  return {
    annotation: ann,
    quality,
    reason,
    bannedPhrasesFound,
    genericIndicatorsFound,
    architectureIndicatorsFound,
  };
}

// ============================================================================
// OUTPUT FORMATTING
// ============================================================================

function formatAnnotation(ca: ClassifiedAnnotation, paraIndex: number): string {
  const ann = ca.annotation;
  const sentLabel = ann.location.sentenceIndex !== null ? `S${ann.location.sentenceIndex}` : 'essay';
  const qualityEmoji = {
    teaches_causal_chain: '[TEACHES]',
    labels_with_decoration: '[LABELS]',
    generic_advice: '[GENERIC]',
  }[ca.quality];

  const lines: string[] = [
    `[P${paraIndex}${sentLabel}] ${ann.type} (phase: ${ann.phase}) — priority ${ann.priority}/5 — confidence ${ann.confidence}`,
    `QUALITY: ${qualityEmoji} ${ca.reason}`,
    `CONTENT: ${ann.content}`,
    `TEACHING RATIONALE: ${ann.teachingRationale}`,
    `NORTH STAR CONNECTION: ${ann.northStarConnection}`,
  ];

  if (ann.rewriteExample) {
    lines.push(`REWRITE EXAMPLE: ${ann.rewriteExample}`);
  }

  if (ann.location.spanText) {
    lines.push(`SPAN: "${ann.location.spanText}"`);
  }

  if (ca.bannedPhrasesFound.length > 0) {
    lines.push(`⚠ BANNED PHRASES: ${ca.bannedPhrasesFound.join(', ')}`);
  }

  if (ca.genericIndicatorsFound.length > 0) {
    lines.push(`⚠ GENERIC INDICATORS: ${ca.genericIndicatorsFound.join(', ')}`);
  }

  return lines.join('\n');
}

// ============================================================================
// MAIN
// ============================================================================

async function main(): Promise<void> {
  console.log('═══════════════════════════════════════════════════════');
  console.log('  L5 TEACHING QUALITY AUDIT');
  console.log('  Running full pipeline (L1→L5) on piano essay...');
  console.log('═══════════════════════════════════════════════════════\n');

  // Read the piano essay
  const essayText = fs.readFileSync(PIANO_ESSAY_PATH, 'utf-8');
  console.log(`Essay loaded: ${essayText.split(/\n\s*\n/).filter(Boolean).length} paragraphs, ${essayText.split(/\s+/).length} words\n`);

  // Run full pipeline
  const input: PipelineInput = {
    essayId: `l5-audit-${Date.now()}`,
    essayText,
    essayType: 'common_app',
    includeAnnotations: true,
  };

  console.log('Starting pipeline...\n');
  const startTime = Date.now();
  const result = await analysisOrchestrator.analyzeEssay(input);
  const elapsed = Date.now() - startTime;

  console.log(`\nPipeline complete in ${(elapsed / 1000).toFixed(1)}s`);
  console.log(`Layers: ${result.layersCompleted.join(', ')}`);
  console.log(`Failed: ${result.layersFailed.map((f) => `${f.layer}: ${f.error.substring(0, 60)}`).join('; ') || 'none'}`);
  console.log(`Cost: $${result.costSummary.totalCost.toFixed(4)}`);
  console.log(`Phase: ${result.improvementPhase?.level ?? 'unknown'}`);

  if (!result.annotations) {
    console.error('\n❌ No annotations generated. L5 failed or was skipped.');
    process.exit(1);
  }

  const annotations = result.annotations;
  console.log(`\nAnnotations: ${annotations.annotationCount} total`);
  console.log(`  Paragraph-level: ${annotations.paragraphAnnotations.reduce((s, p) => s + p.annotations.length, 0)}`);
  console.log(`  Essay-level: ${annotations.essayLevelAnnotations.length}`);

  // ── Classify all annotations ──
  const allClassified: ClassifiedAnnotation[] = [];

  for (const pa of annotations.paragraphAnnotations) {
    for (const ann of pa.annotations) {
      allClassified.push(classifyAnnotation(ann));
    }
  }
  for (const ann of annotations.essayLevelAnnotations) {
    allClassified.push(classifyAnnotation(ann));
  }

  // ── Calculate distribution ──
  const teaches = allClassified.filter((c) => c.quality === 'teaches_causal_chain');
  const labels = allClassified.filter((c) => c.quality === 'labels_with_decoration');
  const generic = allClassified.filter((c) => c.quality === 'generic_advice');

  const total = allClassified.length;
  const teachPct = total > 0 ? (teaches.length / total * 100).toFixed(1) : '0';
  const labelPct = total > 0 ? (labels.length / total * 100).toFixed(1) : '0';
  const genericPct = total > 0 ? (generic.length / total * 100).toFixed(1) : '0';

  // ── Banned phrase scan ──
  const withBannedPhrases = allClassified.filter((c) => c.bannedPhrasesFound.length > 0);

  // ── Build output file ──
  const outputLines: string[] = [];

  outputLines.push('═══════════════════════════════════════════════════════════════');
  outputLines.push('  L5 TEACHING QUALITY AUDIT — FULL RESULTS');
  outputLines.push(`  Date: ${new Date().toISOString()}`);
  outputLines.push(`  Essay: piano-essay.txt`);
  outputLines.push(`  Phase: ${annotations.phase}`);
  outputLines.push(`  Pipeline time: ${(elapsed / 1000).toFixed(1)}s`);
  outputLines.push(`  Pipeline cost: $${result.costSummary.totalCost.toFixed(4)}`);
  outputLines.push('═══════════════════════════════════════════════════════════════\n');

  // Summary
  outputLines.push('QUALITY DISTRIBUTION:');
  outputLines.push(`  Teaches with causal chain: ${teaches.length}/${total} (${teachPct}%)`);
  outputLines.push(`  Labels with decoration:    ${labels.length}/${total} (${labelPct}%)`);
  outputLines.push(`  Generic writing advice:    ${generic.length}/${total} (${genericPct}%)`);
  outputLines.push('');

  outputLines.push('BANNED PHRASE VIOLATIONS:');
  if (withBannedPhrases.length === 0) {
    outputLines.push('  None found ✓');
  } else {
    for (const ca of withBannedPhrases) {
      outputLines.push(`  ⚠ P${ca.annotation.location.paragraphIndex}: "${ca.bannedPhrasesFound.join('", "')}"`);
      outputLines.push(`    In: "${ca.annotation.content.substring(0, 100)}..."`);
    }
  }
  outputLines.push('');

  // Cost breakdown
  outputLines.push('COST BREAKDOWN:');
  for (const layer of result.costSummary.layers) {
    outputLines.push(`  ${layer.layer}: $${layer.cost.toFixed(4)} (${layer.timingMs}ms)`);
  }
  outputLines.push('');

  // Per-paragraph annotations
  outputLines.push('════════════════════════════════════════════════════════');
  outputLines.push('  ANNOTATIONS BY PARAGRAPH');
  outputLines.push('════════════════════════════════════════════════════════\n');

  for (const pa of annotations.paragraphAnnotations) {
    const paraText = result.profile.paragraphs[pa.paragraphIndex]?.text ?? '';
    const preview = paraText.substring(0, 120) + (paraText.length > 120 ? '...' : '');

    outputLines.push(`── P${pa.paragraphIndex}: "${preview}" ──`);
    outputLines.push(`   (${pa.annotations.length} annotations)\n`);

    if (pa.annotations.length === 0) {
      outputLines.push('   [no annotations for this paragraph at current phase]\n');
      continue;
    }

    for (const ann of pa.annotations) {
      const classified = allClassified.find((c) => c.annotation.id === ann.id)!;
      outputLines.push(formatAnnotation(classified, pa.paragraphIndex));
      outputLines.push('');
    }
  }

  // Essay-level annotations
  if (annotations.essayLevelAnnotations.length > 0) {
    outputLines.push('════════════════════════════════════════════════════════');
    outputLines.push('  ESSAY-LEVEL ANNOTATIONS');
    outputLines.push('════════════════════════════════════════════════════════\n');

    for (const ann of annotations.essayLevelAnnotations) {
      const classified = allClassified.find((c) => c.annotation.id === ann.id)!;
      outputLines.push(formatAnnotation(classified, ann.location.paragraphIndex));
      outputLines.push('');
    }
  }

  // Summary at end
  outputLines.push('════════════════════════════════════════════════════════');
  outputLines.push('  QUALITY VERDICT');
  outputLines.push('════════════════════════════════════════════════════════\n');

  const genericPercent = total > 0 ? (generic.length / total * 100) : 0;

  if (genericPercent > 30) {
    outputLines.push(`❌ FAIL: ${genericPct}% generic advice (threshold: ≤30%)`);
    outputLines.push('   The 8-layer pipeline is producing advice that any chatbot could give.');
    outputLines.push('   L5 system prompt needs stronger forcing functions.\n');
  } else if (genericPercent > 15) {
    outputLines.push(`⚠ WARNING: ${genericPct}% generic advice (acceptable but could improve)`);
    outputLines.push('   Some annotations are not pulling their weight.\n');
  } else {
    outputLines.push(`✓ PASS: ${genericPct}% generic advice (well within threshold)`);
  }

  if (parseFloat(teachPct) >= 60) {
    outputLines.push(`✓ Teaching quality: ${teachPct}% teach with causal chains — excellent`);
  } else if (parseFloat(teachPct) >= 40) {
    outputLines.push(`⚠ Teaching quality: ${teachPct}% teach with causal chains — room for improvement`);
  } else {
    outputLines.push(`❌ Teaching quality: ${teachPct}% teach with causal chains — needs significant improvement`);
  }

  if (withBannedPhrases.length === 0) {
    outputLines.push('✓ Banned phrase enforcement: no violations');
  } else {
    outputLines.push(`❌ Banned phrase enforcement: ${withBannedPhrases.length} violations found`);
  }

  // Write output
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, outputLines.join('\n'), 'utf-8');
  console.log(`\nFull audit written to: ${OUTPUT_FILE}`);

  // Console summary
  console.log('\n═══════════════════════════════════════════════════════');
  console.log('  QUALITY DISTRIBUTION');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`  Teaches with causal chain: ${teaches.length}/${total} (${teachPct}%)`);
  console.log(`  Labels with decoration:    ${labels.length}/${total} (${labelPct}%)`);
  console.log(`  Generic writing advice:    ${generic.length}/${total} (${genericPct}%)`);
  console.log(`  Banned phrase violations:  ${withBannedPhrases.length}`);

  if (genericPercent > 30) {
    console.log(`\n❌ FAIL: ${genericPct}% generic advice exceeds 30% threshold`);
  } else {
    console.log(`\n✓ Generic advice rate within threshold (${genericPct}%)`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
