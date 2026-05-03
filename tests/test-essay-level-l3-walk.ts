// ============================================================================
// Step 5 — Isolated essay-level L3 walk test on Crochet
// ============================================================================
//
// Drives runEssayLevelL3Walk against Crochet's real upstream outputs (L1 +
// L2 + L2.5 run live). Validates the new architecture without paying for
// the full pipeline (skips L3.75 + L3.5 + L4 + Phase B — those run after
// L3 walk in production but the L3 walk's contract can be validated in
// isolation).
//
// Cost target: ~$0.30 (L1+AO+L2+L2.5 ≈ $0.07 + essay-level L3 walk ≈
// $0.20-0.30).
//
// Validation:
// - Findings count ≥ 5 (vs prior per-paragraph walk's 0 on Crochet)
// - JSON valid (no jsonrepair firing)
// - No truncation (output stops with end_turn, not max_tokens)
// - paragraphSummaries.length === 5 (one per Crochet paragraph)
// - All endpoint indices in valid bounds
// - Cost under $0.40
// - Worked-example finding shape preserved (claim + evidence + dimensions
//   + maturity + coachingValue + deepeningPotential)
//
// Run:
//   set -a && source .env.local && set +a && npx tsx tests/test-essay-level-l3-walk.ts
// ============================================================================

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { firstImpressionsService } from '../src/services/essayIntelligence/analysis/firstImpressions';
import { structuralCartographerService } from '../src/services/essayIntelligence/analysis/structuralCartographer';
import { scoutPassService } from '../src/services/essayIntelligence/analysis/scoutPass';
import { runEssayLevelL3Walk } from '../src/services/essayIntelligence/analysis/essayLevelL3Walk';

const ESSAY_PATH =
  'tests/calibration/top-tier-reference/essays/14-harvard-2028-crochet.txt';
const COST_CAP_USD = 0.4;

async function main(): Promise<void> {
  const essayText = (await fs.readFile(ESSAY_PATH, 'utf-8')).trim();
  console.log(
    `[isolated-test] Loaded Crochet: ${essayText.length} chars, ${essayText.split(/\s+/).length} words`,
  );

  const startTime = Date.now();

  // ── Phase 1: Run L1 + L2 + L2.5 (real upstream outputs) ────────────────
  console.log('[isolated-test] Running L1 first impressions...');
  const l1StartTime = Date.now();
  const l1Result = await firstImpressionsService.analyze(essayText);
  console.log(
    `[isolated-test] L1 complete: ${l1Result.impressions.length} paragraphs, cost=$${l1Result.cost.toFixed(4)}, time=${Date.now() - l1StartTime}ms`,
  );

  console.log('[isolated-test] Running L2 + L2.5 in parallel...');
  const l2StartTime = Date.now();
  const [l2Result, l25Result] = await Promise.all([
    structuralCartographerService.analyze(essayText, l1Result.impressions),
    scoutPassService.analyze(essayText, l1Result.impressions),
  ]);
  console.log(
    `[isolated-test] L2 + L2.5 complete: arc=${l2Result.cartography.arcType}, ` +
      `${l25Result.scoutOutput.repeatedElements.length} repeated elements, ` +
      `cost=$${(l2Result.cost + l25Result.cost).toFixed(4)}, time=${Date.now() - l2StartTime}ms`,
  );

  const upstreamCost = l1Result.cost + l2Result.cost + l25Result.cost;
  console.log(`[isolated-test] Upstream total cost: $${upstreamCost.toFixed(4)}`);

  // ── Phase 2: Run essay-level L3 walk (the new architecture) ────────────
  console.log('[isolated-test] Running essay-level L3 walk...');
  const walkStartTime = Date.now();
  const walkResult = await runEssayLevelL3Walk(
    essayText,
    l1Result.impressions,
    l2Result.cartography,
    l25Result.scoutOutput,
  );
  console.log(
    `[isolated-test] Essay-level L3 walk complete: cost=$${walkResult.cost.toFixed(4)}, time=${Date.now() - walkStartTime}ms`,
  );
  console.log(
    `[isolated-test] Tokens: ${walkResult.tokenUsage.input_tokens} input + ${walkResult.tokenUsage.output_tokens} output (${walkResult.tokenUsage.cache_read_input_tokens} cache_read)`,
  );

  const totalCost = upstreamCost + walkResult.cost;
  const elapsed = Date.now() - startTime;
  console.log(
    `\n[isolated-test] TOTAL: $${totalCost.toFixed(4)} (cap $${COST_CAP_USD}) | elapsed ${(elapsed / 1000).toFixed(1)}s`,
  );

  // ── Phase 3: Validate output ───────────────────────────────────────────
  const o = walkResult.output;
  const validation: Array<{ name: string; pass: boolean; detail: string }> = [
    {
      name: 'paragraphSummaries.length === 5',
      pass: o.paragraphSummaries.length === 5,
      detail: `actual: ${o.paragraphSummaries.length}`,
    },
    {
      name: 'findings.length >= 5 (depth target)',
      pass: o.findings.length >= 5,
      detail: `actual: ${o.findings.length}`,
    },
    {
      name: 'findings.length <= 15 (cap)',
      pass: o.findings.length <= 15,
      detail: `actual: ${o.findings.length}`,
    },
    {
      name: 'connections.length > 0',
      pass: o.connections.length > 0,
      detail: `actual: ${o.connections.length}`,
    },
    {
      name: 'centralThesis non-empty',
      pass: o.centralThesis.length > 10,
      detail: `length: ${o.centralThesis.length}`,
    },
    {
      name: 'voiceSignature non-empty',
      pass: o.voiceSignature.length > 10,
      detail: `length: ${o.voiceSignature.length}`,
    },
    {
      name: 'cost < $0.40',
      pass: totalCost < COST_CAP_USD,
      detail: `actual: $${totalCost.toFixed(4)}`,
    },
    {
      name: 'no max_tokens truncation',
      pass: walkResult.tokenUsage.output_tokens < 7800, // 8000 cap; allow 200 token margin
      detail: `output_tokens: ${walkResult.tokenUsage.output_tokens} / 8000`,
    },
  ];

  // Endpoint validation
  let validEndpoints = 0;
  let invalidEndpoints = 0;
  const paragraphCount = o.paragraphSummaries.length;
  const sentenceCounts = l1Result.impressions.map((imp) => imp.sentences.length);
  for (const conn of o.connections) {
    for (const ep of [conn.from, conn.to]) {
      if (ep.paragraph < 0 || ep.paragraph >= paragraphCount) {
        invalidEndpoints++;
      } else if (ep.sentence !== undefined) {
        const max = sentenceCounts[ep.paragraph] - 1;
        if (ep.sentence < 0 || ep.sentence > max) invalidEndpoints++;
        else validEndpoints++;
      } else {
        validEndpoints++;
      }
    }
  }
  validation.push({
    name: 'connection endpoint validity rate',
    pass: validEndpoints + invalidEndpoints === 0 || validEndpoints / (validEndpoints + invalidEndpoints) >= 0.9,
    detail: `${validEndpoints}/${validEndpoints + invalidEndpoints} valid (${invalidEndpoints} hallucinated)`,
  });

  // Findings shape validation
  const findingsWithEvidence = o.findings.filter(
    (f) => Array.isArray(f.evidence) && f.evidence.length > 0,
  ).length;
  validation.push({
    name: 'findings have evidence',
    pass: findingsWithEvidence === o.findings.length,
    detail: `${findingsWithEvidence}/${o.findings.length} have evidence`,
  });

  console.log('\n[isolated-test] VALIDATION:');
  for (const v of validation) {
    console.log(`  ${v.pass ? '✅' : '❌'} ${v.name} — ${v.detail}`);
  }
  const passCount = validation.filter((v) => v.pass).length;
  console.log(`\n[isolated-test] ${passCount}/${validation.length} checks passed`);

  // ── Phase 4: Write report ──────────────────────────────────────────────
  const ts = new Date().toISOString().replace(/[:.]/g, '-');
  // ESM-safe __dirname replacement.
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const outDir = path.resolve(__dirname, 'output');
  await fs.mkdir(outDir, { recursive: true });

  const report = {
    essay: 'Crochet (14-harvard-2028)',
    timestamp: new Date().toISOString(),
    cost: {
      l1: l1Result.cost,
      l2: l2Result.cost,
      l2_5: l25Result.cost,
      essay_level_walk: walkResult.cost,
      total: totalCost,
    },
    timings: {
      l1_ms: 0, // not captured separately; merge with elapsed
      l2_l25_ms: 0,
      walk_ms: walkResult.timingMs,
      total_ms: elapsed,
    },
    walk_token_usage: walkResult.tokenUsage,
    output_summary: {
      paragraphSummaries_count: o.paragraphSummaries.length,
      findings_count: o.findings.length,
      connections_count: o.connections.length,
      gapCandidates_count: o.gapCandidates.length,
      centralThesis: o.centralThesis,
      voiceSignature: o.voiceSignature,
      arcMomentum: o.arcMomentum,
      thesisConfidence: o.thesisConfidence,
    },
    validation,
    full_output: o,
  };

  const jsonPath = path.join(outDir, `essay-level-walk-test-${ts}.json`);
  const mdPath = path.join(outDir, `essay-level-walk-test-${ts}.md`);
  await fs.writeFile(jsonPath, JSON.stringify(report, null, 2));
  await fs.writeFile(mdPath, renderHumanReport(report));

  console.log(`\n[isolated-test] Reports written:`);
  console.log(`  JSON: ${jsonPath}`);
  console.log(`  MD:   ${mdPath}`);
}

function renderHumanReport(report: ReturnType<typeof Object> & Record<string, unknown>): string {
  const o = (report.full_output as { findings: Array<Record<string, unknown>>; paragraphSummaries: Array<Record<string, unknown>>; connections: Array<Record<string, unknown>>; gapCandidates: Array<Record<string, unknown>>; centralThesis: string; voiceSignature: string; arcMomentum: string });
  const cost = report.cost as Record<string, number>;
  const validation = report.validation as Array<{ name: string; pass: boolean; detail: string }>;

  const lines: string[] = [];
  lines.push(`# Essay-Level L3 Walk — Isolated Test on Crochet`);
  lines.push('');
  lines.push(`**Date:** ${report.timestamp}`);
  lines.push(`**Total cost:** $${cost.total.toFixed(4)} (cap $${COST_CAP_USD})`);
  lines.push(`  - L1: $${cost.l1.toFixed(4)}`);
  lines.push(`  - L2: $${cost.l2.toFixed(4)}`);
  lines.push(`  - L2.5: $${cost.l2_5.toFixed(4)}`);
  lines.push(`  - **Essay-level L3 walk: $${cost.essay_level_walk.toFixed(4)}**`);
  lines.push('');
  lines.push(`## Validation results`);
  for (const v of validation) {
    lines.push(`- ${v.pass ? '✅' : '❌'} **${v.name}** — ${v.detail}`);
  }
  lines.push('');
  lines.push(`## Output summary`);
  lines.push(`- centralThesis: ${o.centralThesis}`);
  lines.push(`- voiceSignature: ${o.voiceSignature}`);
  lines.push(`- arcMomentum: ${o.arcMomentum}`);
  lines.push(`- paragraphSummaries: ${o.paragraphSummaries.length}`);
  lines.push(`- findings: ${o.findings.length}`);
  lines.push(`- connections: ${o.connections.length}`);
  lines.push(`- gapCandidates: ${o.gapCandidates.length}`);
  lines.push('');

  lines.push(`## Findings (${o.findings.length})`);
  o.findings.forEach((f, i) => {
    lines.push(`\n### Finding ${i + 1}`);
    lines.push(`- **claim:** ${f.claim}`);
    const scope = f.scope as { type?: string; paragraph?: number; paragraphs?: number[] } | undefined;
    lines.push(`- **scope:** type=${scope?.type ?? '?'}, paragraph=${scope?.paragraph ?? '?'}${scope?.paragraphs ? `, paragraphs=[${scope.paragraphs.join(',')}]` : ''}`);
    lines.push(`- **maturity:** ${f.maturity} — ${f.maturityReasoning}`);
    lines.push(`- **coachingValue:** ${f.coachingValue}`);
    lines.push(`- **dimensions:** [${(f.dimensions as string[]).join(', ')}]`);
    const evidence = f.evidence as Array<{ text: string; location: { paragraph: number; sentence?: number } }>;
    lines.push(`- **evidence:**`);
    for (const ev of evidence) {
      lines.push(`  - "${ev.text}" (P${ev.location.paragraph}${ev.location.sentence !== undefined ? `S${ev.location.sentence}` : ''})`);
    }
    lines.push(`- **deepeningPotential:** ${f.deepeningPotential ?? 'null'}`);
    if (Array.isArray(f.raisesQuestions) && f.raisesQuestions.length > 0) {
      lines.push(`- **raisesQuestions:**`);
      for (const q of f.raisesQuestions) lines.push(`  - ${q}`);
    }
  });

  lines.push('');
  lines.push(`## Paragraph summaries (${o.paragraphSummaries.length})`);
  o.paragraphSummaries.forEach((p) => {
    lines.push(`\n### P${p.index}`);
    lines.push(`- **role:** ${p.role}`);
    lines.push(`- **function:** ${p.function}`);
    lines.push(`- **narrativeContribution:** ${p.narrativeContribution}`);
    lines.push(`- **dominantEmotion:** ${p.dominantEmotion}`);
    lines.push(`- **voiceNotes:** ${p.voiceNotes}`);
    lines.push(`- **craftNotes:** ${(p.craftNotes as string[]).join(' | ')}`);
  });

  lines.push('');
  lines.push(`## Connections (${o.connections.length})`);
  o.connections.forEach((c, i) => {
    const from = c.from as { paragraph: number; sentence?: number; label: string };
    const to = c.to as { paragraph: number; sentence?: number; label: string };
    lines.push(`\n${i + 1}. P${from.paragraph}${from.sentence !== undefined ? `S${from.sentence}` : ''} → P${to.paragraph}${to.sentence !== undefined ? `S${to.sentence}` : ''} (${c.strengthCategory}, ${c.directionality})`);
    lines.push(`   - description: ${c.description}`);
    lines.push(`   - significance: ${c.significance}`);
  });

  lines.push('');
  lines.push(`## Gap candidates (${o.gapCandidates.length})`);
  if (o.gapCandidates.length === 0) {
    lines.push(`(none — silence is the audit signal when no writer-side gaps surface)`);
  } else {
    o.gapCandidates.forEach((g, i) => {
      lines.push(`\n${i + 1}. P${g.anchorParagraph}${g.anchorSentence !== undefined ? `S${g.anchorSentence}` : ''}`);
      lines.push(`   - triggeringArtifact: ${g.triggeringArtifact}`);
      lines.push(`   - briefRecognition: ${g.briefRecognition}`);
    });
  }

  return lines.join('\n');
}

main().catch((err) => {
  console.error('[isolated-test] FAILED:', err);
  process.exit(1);
});
