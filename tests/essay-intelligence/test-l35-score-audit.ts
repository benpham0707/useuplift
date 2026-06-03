/**
 * L3.5 Score Calibration Audit
 *
 * Tests whether L3.5 (analysisPass) actually differentiates sentence scores or
 * clusters them in the "safe" 70-85 range. Runs the full pipeline (L1→L3.5)
 * on two essays with known quality differences:
 *   1. Piano essay (mediocre — template language, generic metaphors)
 *   2. Excellent activity essay (genuine story, specific detail, real insight)
 *
 * Outputs:
 *   tests/output/l35-score-audit.json        — full data
 *   tests/output/l35-score-audit-summary.txt  — human-readable statistics
 */

// IMPORTANT: dotenv MUST load before any service imports (ESM hoists static imports)
import * as dotenv from 'dotenv';
dotenv.config();
// Verify key is available
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('FATAL: ANTHROPIC_API_KEY not found after dotenv.config().');
  console.error('Ensure .env file exists in project root with ANTHROPIC_API_KEY=sk-...');
  process.exit(1);
}
console.log(`API key loaded (${process.env.ANTHROPIC_API_KEY.length} chars)`);

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// ESSAYS
// ============================================================================

const PIANO_ESSAY = fs.readFileSync(
  path.join(__dirname, '..', 'fixtures', 'piano-essay.txt'),
  'utf-8',
).trim();

// Activity description used as a short essay (1 paragraph, multiple sentences)
const EXCELLENT_ESSAY_TEXT =
  `Most Wednesdays smelled like bleach and citrus. I learned which regulars ` +
  `wanted to talk and which just needed silence while I checked them in. ` +
  `Started as a greeter, but three months in, I noticed patients struggling ` +
  `with our intake form—some couldn't read English well, others seemed ` +
  `overwhelmed by medical jargon. I redesigned the form with my supervisor ` +
  `Ana, cutting questions from 47 to 22 and adding simple icons. Wait times ` +
  `dropped from 18 minutes to 9, and patients started asking follow-up ` +
  `questions instead of just nodding. By spring, I was training two freshmen ` +
  `to run intake so the system wouldn't collapse when I graduated. I used to ` +
  `think efficiency meant speed, but I learned it actually means removing the ` +
  `barriers that make people feel small. That insight changed how I approach ` +
  `every group project now—I pause and ask what we're missing, not just what ` +
  `we need to do faster.`;

// ============================================================================
// STATISTICS HELPERS
// ============================================================================

function computeStats(scores: number[]) {
  if (scores.length === 0) return { min: 0, max: 0, mean: 0, median: 0, stdev: 0, count: 0 };
  const sorted = [...scores].sort((a, b) => a - b);
  const sum = scores.reduce((a, b) => a + b, 0);
  const mean = sum / scores.length;
  const variance = scores.reduce((a, b) => a + (b - mean) ** 2, 0) / scores.length;
  const stdev = Math.sqrt(variance);
  const median = scores.length % 2 === 0
    ? (sorted[scores.length / 2 - 1] + sorted[scores.length / 2]) / 2
    : sorted[Math.floor(scores.length / 2)];
  return { min: sorted[0], max: sorted[sorted.length - 1], mean, median, stdev, count: scores.length };
}

function buildHistogram(scores: number[]): Record<string, number> {
  const buckets: Record<string, number> = {
    '<40': 0,
    '40-54': 0,
    '55-75': 0,
    '76-85': 0,
    '86-95': 0,
    '96-100': 0,
  };
  for (const s of scores) {
    if (s < 40) buckets['<40']++;
    else if (s <= 54) buckets['40-54']++;
    else if (s <= 75) buckets['55-75']++;
    else if (s <= 85) buckets['76-85']++;
    else if (s <= 95) buckets['86-95']++;
    else buckets['96-100']++;
  }
  return buckets;
}

// ============================================================================
// EXTRACT SENTENCE SCORES FROM PIPELINE RESULT
// ============================================================================

interface SentenceDetail {
  paragraph: number;
  sentence: number;
  text: string;
  effectiveness: number;
  effectivenessReasoning: string;
  isStrength: boolean;
  isProblem: boolean;
  priorityForImprovement: number;
  strengths: Array<{ observation: string; evidence: string }>;
  weaknesses: Array<{ observation: string; evidence: string }>;
}

// ============================================================================
// MAIN — uses dynamic imports to ensure dotenv loads first
// ============================================================================

async function main() {
  console.log('=== L3.5 Score Calibration Audit ===\n');

  // Dynamic imports — these run AFTER dotenv.config() has set process.env
  const { AnalysisOrchestrator } = await import('../../src/services/essayIntelligence/analysis/analysisOrchestrator');
  type PipelineInput = import('../src/services/essayIntelligence/analysis/analysisOrchestrator').PipelineInput;
  type PipelineResult = import('../src/services/essayIntelligence/analysis/analysisOrchestrator').PipelineResult;

  function extractSentenceDetails(result: PipelineResult): SentenceDetail[] {
    const details: SentenceDetail[] = [];
    const profile = result.profile;

    for (const para of profile.paragraphs) {
      for (const sentence of para.sentences) {
        const sa = sentence.analysis;
        if (!sa) continue;

        details.push({
          paragraph: para.index,
          sentence: sentence.index,
          text: sentence.text,
          effectiveness: sa.effectiveness,
          effectivenessReasoning: sa.effectivenessReasoning,
          isStrength: sa.isStrength,
          isProblem: sa.isProblem,
          priorityForImprovement: sa.priorityForImprovement,
          strengths: sa.strengths.map((s: { observation: string; evidence?: string }) => ({ observation: s.observation, evidence: s.evidence ?? '' })),
          weaknesses: sa.weaknesses.map((w: { observation: string; evidence?: string }) => ({ observation: w.observation, evidence: w.evidence ?? '' })),
        });
      }
    }

    return details;
  }

  const orchestrator = new AnalysisOrchestrator();

  // --- Run Pipeline: Piano Essay (mediocre) ---
  console.log('--- Running pipeline on PIANO essay (mediocre) ---\n');
  const pianoInput: PipelineInput = {
    essayId: 'l35-audit-piano',
    essayText: PIANO_ESSAY,
    essayType: 'common_app',
    promptText: 'Some students have a background, identity, interest, or talent that is so meaningful they believe their application would be incomplete without it.',
    includeAnnotations: false, // Skip L5 — we only need L3.5 scores
  };

  const pianoResult = await orchestrator.analyzeEssay(pianoInput);
  console.log(`\nPiano pipeline: layers=${pianoResult.layersCompleted.join(',')}, cost=$${pianoResult.costSummary.totalCost.toFixed(4)}\n`);

  // --- Run Pipeline: Excellent Essay ---
  console.log('--- Running pipeline on EXCELLENT essay ---\n');
  const excellentInput: PipelineInput = {
    essayId: 'l35-audit-excellent',
    essayText: EXCELLENT_ESSAY_TEXT,
    essayType: 'common_app', // Treat as common app for pipeline compatibility
    promptText: 'Discuss an accomplishment, event, or realization that sparked a period of personal growth.',
    includeAnnotations: false,
  };

  const excellentResult = await orchestrator.analyzeEssay(excellentInput);
  console.log(`\nExcellent pipeline: layers=${excellentResult.layersCompleted.join(',')}, cost=$${excellentResult.costSummary.totalCost.toFixed(4)}\n`);

  // --- Extract Data ---
  const pianoDetails = extractSentenceDetails(pianoResult);
  const excellentDetails = extractSentenceDetails(excellentResult);

  const pianoScores = pianoDetails.map(d => d.effectiveness);
  const excellentScores = excellentDetails.map(d => d.effectiveness);

  const pianoStats = computeStats(pianoScores);
  const excellentStats = computeStats(excellentScores);

  const pianoHistogram = buildHistogram(pianoScores);
  const excellentHistogram = buildHistogram(excellentScores);

  // --- Build Summary ---
  const lines: string[] = [];
  lines.push('=============================================================');
  lines.push('  L3.5 SCORE CALIBRATION AUDIT — SUMMARY');
  lines.push('=============================================================\n');

  lines.push('--- PIANO ESSAY (mediocre) ---');
  lines.push(`  Sentences: ${pianoStats.count}`);
  lines.push(`  Min: ${pianoStats.min}  Max: ${pianoStats.max}  Mean: ${pianoStats.mean.toFixed(1)}  Median: ${pianoStats.median}  StDev: ${pianoStats.stdev.toFixed(1)}`);
  lines.push(`  Histogram:`);
  for (const [bucket, count] of Object.entries(pianoHistogram)) {
    const bar = '#'.repeat(count);
    lines.push(`    ${bucket.padEnd(8)} ${String(count).padStart(2)} ${bar}`);
  }
  lines.push(`  Improvement Phase: ${pianoResult.improvementPhase?.level ?? 'N/A'}`);
  lines.push(`  Phase Reasoning: ${pianoResult.improvementPhase?.reasoning ?? 'N/A'}`);
  lines.push('');

  lines.push('--- EXCELLENT ESSAY ---');
  lines.push(`  Sentences: ${excellentStats.count}`);
  lines.push(`  Min: ${excellentStats.min}  Max: ${excellentStats.max}  Mean: ${excellentStats.mean.toFixed(1)}  Median: ${excellentStats.median}  StDev: ${excellentStats.stdev.toFixed(1)}`);
  lines.push(`  Histogram:`);
  for (const [bucket, count] of Object.entries(excellentHistogram)) {
    const bar = '#'.repeat(count);
    lines.push(`    ${bucket.padEnd(8)} ${String(count).padStart(2)} ${bar}`);
  }
  lines.push(`  Improvement Phase: ${excellentResult.improvementPhase?.level ?? 'N/A'}`);
  lines.push(`  Phase Reasoning: ${excellentResult.improvementPhase?.reasoning ?? 'N/A'}`);
  lines.push('');

  // --- Diagnostic Verdicts ---
  lines.push('--- CALIBRATION VERDICTS ---');

  const spreadOk = pianoStats.stdev > 10;
  lines.push(`  [${spreadOk ? 'PASS' : 'FAIL'}] Piano StDev > 10: ${pianoStats.stdev.toFixed(1)}`);

  const excellentSpreadOk = excellentStats.stdev > 10;
  lines.push(`  [${excellentSpreadOk ? 'PASS' : 'FAIL'}] Excellent StDev > 10: ${excellentStats.stdev.toFixed(1)}`);

  const gapOk = excellentStats.mean - pianoStats.mean > 5;
  lines.push(`  [${gapOk ? 'PASS' : 'FAIL'}] Mean gap (excellent - piano) > 5: ${(excellentStats.mean - pianoStats.mean).toFixed(1)}`);

  const hasLow = pianoScores.some(s => s < 55);
  lines.push(`  [${hasLow ? 'PASS' : 'FAIL'}] Piano has any score < 55: ${hasLow}`);

  const hasVeryLow = pianoScores.some(s => s < 40);
  lines.push(`  [${hasVeryLow ? 'PASS' : 'INFO'}] Piano has any score < 40: ${hasVeryLow}`);

  const pianoNoInflation = pianoStats.mean < 72;
  lines.push(`  [${pianoNoInflation ? 'PASS' : 'FAIL'}] Piano mean < 72 (no inflation): ${pianoStats.mean.toFixed(1)}`);

  const excellentNotDeflated = excellentStats.mean > 65;
  lines.push(`  [${excellentNotDeflated ? 'PASS' : 'FAIL'}] Excellent mean > 65 (not deflated): ${excellentStats.mean.toFixed(1)}`);

  // Check piano opening sentence specifically
  const pianoOpening = pianoDetails.find(d => d.paragraph === 0 && d.sentence === 0);
  if (pianoOpening) {
    const openingOk = pianoOpening.effectiveness <= 55;
    lines.push(`  [${openingOk ? 'PASS' : 'FAIL'}] Piano opening sentence <= 55: ${pianoOpening.effectiveness} ("${pianoOpening.text.slice(0, 80)}...")`);
  }

  // Check for high-end restraint in piano
  const pianoHighEnd = pianoScores.filter(s => s >= 85);
  const pianoHighEndOk = pianoHighEnd.length <= 2;
  lines.push(`  [${pianoHighEndOk ? 'PASS' : 'FAIL'}] Piano has <= 2 scores >= 85: ${pianoHighEnd.length}`);

  lines.push('');

  // --- Per-Sentence Details ---
  lines.push('--- PIANO ESSAY: ALL SENTENCES (sorted by score) ---');
  const pianoSorted = [...pianoDetails].sort((a, b) => a.effectiveness - b.effectiveness);
  for (const d of pianoSorted) {
    const flags = [d.isStrength ? 'STR' : '', d.isProblem ? 'PROB' : ''].filter(Boolean).join(' ');
    lines.push(`  [${d.effectiveness.toString().padStart(3)}] ${flags.padEnd(5)} P${d.paragraph}S${d.sentence}: "${d.text.slice(0, 100)}${d.text.length > 100 ? '...' : ''}"`);
    lines.push(`         Reasoning: ${d.effectivenessReasoning.slice(0, 200)}`);
    lines.push('');
  }

  lines.push('--- EXCELLENT ESSAY: ALL SENTENCES (sorted by score) ---');
  const excellentSorted = [...excellentDetails].sort((a, b) => a.effectiveness - b.effectiveness);
  for (const d of excellentSorted) {
    const flags = [d.isStrength ? 'STR' : '', d.isProblem ? 'PROB' : ''].filter(Boolean).join(' ');
    lines.push(`  [${d.effectiveness.toString().padStart(3)}] ${flags.padEnd(5)} P${d.paragraph}S${d.sentence}: "${d.text.slice(0, 100)}${d.text.length > 100 ? '...' : ''}"`);
    lines.push(`         Reasoning: ${d.effectivenessReasoning.slice(0, 200)}`);
    lines.push('');
  }

  // --- Write Outputs ---
  const outputDir = path.join(__dirname, '..', 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const summaryText = lines.join('\n');
  fs.writeFileSync(path.join(outputDir, 'l35-score-audit-summary.txt'), summaryText, 'utf-8');

  const jsonData = {
    timestamp: new Date().toISOString(),
    piano: {
      stats: pianoStats,
      histogram: pianoHistogram,
      improvementPhase: pianoResult.improvementPhase,
      costSummary: pianoResult.costSummary,
      sentences: pianoDetails,
    },
    excellent: {
      stats: excellentStats,
      histogram: excellentHistogram,
      improvementPhase: excellentResult.improvementPhase,
      costSummary: excellentResult.costSummary,
      sentences: excellentDetails,
    },
  };
  fs.writeFileSync(
    path.join(outputDir, 'l35-score-audit.json'),
    JSON.stringify(jsonData, null, 2),
    'utf-8',
  );

  // Print summary
  console.log('\n' + summaryText);
  console.log(`\nOutputs written to:`);
  console.log(`  ${path.join(outputDir, 'l35-score-audit-summary.txt')}`);
  console.log(`  ${path.join(outputDir, 'l35-score-audit.json')}`);
}

main().catch((err) => {
  console.error('FATAL:', err);
  process.exit(1);
});
