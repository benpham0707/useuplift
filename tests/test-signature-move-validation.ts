// ============================================================================
// Quality Gap 1 — SignatureMove end-to-end validation harness
// ============================================================================
//
// Runs the full L1→L4 pipeline on a calibration essay, extracts
// `profile.craftAssessment.signatureMove`, evaluates the 8 structural pass
// criteria from the plan, and writes a per-essay report.
//
// Run:
//   set -a && source .env.local && set +a
//   npx tsx tests/test-signature-move-validation.ts                                  # Crochet (default)
//   npx tsx tests/test-signature-move-validation.ts --essay 06-harvard-2028-three-days-before-a-plane.txt
//
// Cost target: ~$1.20 per essay (full pipeline). Hard cap: $5.
// ============================================================================

import { promises as fs } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { analysisOrchestrator } from '../src/services/essayIntelligence/analysis/analysisOrchestrator';
import type {
  EssayProfile,
  SignatureMove,
  SignatureMoveInstance,
} from '../src/services/essayIntelligence/profileTypes';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ESSAY_FILENAME = (() => {
  const idx = process.argv.indexOf('--essay');
  return idx >= 0 && process.argv[idx + 1]
    ? process.argv[idx + 1]
    : '14-harvard-2028-crochet.txt';
})();
const ESSAY_PATH = path.join(
  __dirname,
  'calibration',
  'top-tier-reference',
  'essays',
  ESSAY_FILENAME,
);
const ESSAY_LABEL = ESSAY_FILENAME.replace(/\.txt$/, '');
const OUTPUT_DIR = path.join(__dirname, 'output');
const COST_HARD_CAP_USD = 5.0;

const FORBIDDEN_VOCAB = [
  'vivid',
  'engaging',
  'authentic',
  'powerful',
  'effective',
  'strong',
  'compelling',
  'beautiful',
  'moving',
];

const TECHNIQUE_NOUNS = [
  'opener',
  'misdirection',
  'triplet',
  'anaphora',
  'callback',
  'register-shift',
  'register shift',
  'compression',
  'parataxis',
  'asyndeton',
  'chiasmus',
  'disproportion',
  'inversion',
  'ethical-inflection',
  'double-connotation',
  'parenthetical',
  'fragment',
  'pivot',
  'beat-drop',
  'bookend',
  'architecture',
  'accumulated specifics',
  'compound',
  'causal-chain',
];

function fmtCost(n: number): string {
  return `$${n.toFixed(4)}`;
}

function fmtMs(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const s = ms / 1000;
  if (s < 60) return `${s.toFixed(1)}s`;
  return `${Math.floor(s / 60)}m${Math.round(s % 60)}s`;
}

interface CriterionResult {
  id: string;
  name: string;
  passed: boolean;
  detail: string;
}

function evaluateCriteria(
  sm: SignatureMove | null | undefined,
  paragraphTexts: readonly string[],
): CriterionResult[] {
  const results: CriterionResult[] = [];

  if (sm == null) {
    results.push({
      id: 'NULL',
      name: 'signatureMove is null',
      passed: false,
      detail: 'For Crochet and Three Days, null is FAIL — the human reviews explicitly identify defining moves.',
    });
    return results;
  }

  // 1. Specificity — at least one technique noun in oneSentenceName
  const lowered = sm.oneSentenceName.toLowerCase();
  const matchedTechnique = TECHNIQUE_NOUNS.find((t) => lowered.includes(t.toLowerCase()));
  results.push({
    id: '1',
    name: 'Specificity — oneSentenceName contains a syntactic/structural/rhetorical technique noun',
    passed: !!matchedTechnique,
    detail: matchedTechnique ? `matched: "${matchedTechnique}"` : 'no technique noun matched',
  });

  // 2. Locational — paragraph reference (P0/P1/P2/.../P\d) in oneSentenceName
  const locationalMatch = /\bP\d+\b/i.exec(sm.oneSentenceName);
  results.push({
    id: '2',
    name: 'Locational — oneSentenceName cites a paragraph (P\\d)',
    passed: !!locationalMatch,
    detail: locationalMatch ? `cited: ${locationalMatch[0]}` : 'no paragraph reference',
  });

  // 3. Cardinality — instances.length >= 3 AND covers >= 2 distinct paragraphs
  const distinctParas = new Set<number>();
  for (const inst of sm.instances) {
    if (inst.kind === 'sentence_quote') distinctParas.add(inst.location.paragraph);
    else if (inst.kind === 'paragraph_compression') distinctParas.add(inst.paragraph);
    else for (const p of inst.paragraphs) distinctParas.add(p);
  }
  const cardOk = sm.instances.length >= 3 && distinctParas.size >= 2;
  results.push({
    id: '3',
    name: 'Cardinality — ≥3 instances covering ≥2 distinct paragraphs',
    passed: cardOk,
    detail: `${sm.instances.length} instances, ${distinctParas.size} distinct paragraphs (${[...distinctParas].sort().join(',')})`,
  });

  // 4. Grounding — every sentence_quote substring already enforced by validator;
  // also re-check here (independent verification)
  let groundingOk = true;
  const groundingDetails: string[] = [];
  for (let i = 0; i < sm.instances.length; i++) {
    const inst = sm.instances[i] as SignatureMoveInstance;
    if (inst.kind === 'sentence_quote') {
      const para = inst.location.paragraph;
      if (para < 0 || para >= paragraphTexts.length) {
        groundingOk = false;
        groundingDetails.push(`instance[${i}]: paragraph ${para} out of range`);
        continue;
      }
      // Same normalization as validator
      const norm = (s: string): string =>
        s
          .replace(/[‘’‚‛]/g, "'")
          .replace(/[“”„‟]/g, '"')
          .replace(/[–—―−]/g, '-')
          .replace(/\s+/g, ' ')
          .replace(/\s*-\s*/g, '-')
          .trim()
          .toLowerCase();
      const haystack = norm(paragraphTexts[para]);
      const needle = norm(inst.quotedText);
      if (!haystack.includes(needle)) {
        groundingOk = false;
        groundingDetails.push(`instance[${i}]: not substring of P${para}`);
      }
    }
  }
  results.push({
    id: '4',
    name: 'Grounding — every sentence_quote verbatim in cited paragraph; every index in range',
    passed: groundingOk,
    detail: groundingOk ? 'all instances grounded' : groundingDetails.join('; '),
  });

  // 5. Content-specific — whyItIsTheirs references content from THIS essay.
  // Heuristic: the rationale mentions at least one named entity / specific from
  // the essay (e.g. for Crochet: "Agnes", "650 words", "century", "yarn",
  // "grandmother"; for Three Days: "milk", "Izzy", "MITES", "plane"). We
  // operationalize as: at least one ≥4-character token from oneSentenceName
  // OR one named entity heuristic (capitalized non-leading word) appearing
  // in whyItIsTheirs OR in the essay text. This is a soft heuristic — final
  // judgement is human.
  const why = sm.whyItIsTheirs;
  const essayBlob = paragraphTexts.join(' ').toLowerCase();
  const whyTokens = why
    .split(/[^A-Za-z0-9'-]+/)
    .filter((t) => t.length >= 4)
    .map((t) => t.toLowerCase());
  const overlapCount = whyTokens.filter((t) => essayBlob.includes(t)).length;
  const distinctOverlap = new Set(whyTokens.filter((t) => essayBlob.includes(t))).size;
  results.push({
    id: '5',
    name: 'Content-specific — whyItIsTheirs references essay content (≥3 distinct ≥4-char tokens overlap with essay text)',
    passed: distinctOverlap >= 3,
    detail: `${distinctOverlap} distinct tokens overlap (${overlapCount} total occurrences)`,
  });

  // 6. Effect — readerEffect uses cognitive/felt language, not praise.
  // Soft heuristic: readerEffect must NOT be just "it works" / "engaging" /
  // "good"; we check forbidden vocab absence and at least one cognitive verb.
  const effect = sm.readerEffect.toLowerCase();
  const cognitiveVerbs = [
    'commit',
    'committed',
    'absorbs',
    'rewarded',
    'reward',
    'pulled',
    'pulls',
    'primed',
    'register',
    'registers',
    'feels',
    'felt',
    'relief',
    'closure',
    'expects',
    'curious',
    'curiosity',
    'forward',
    'surprise',
    'surprised',
    'attention',
    'engaged',
    'tension',
  ];
  const hasCognitive = cognitiveVerbs.some((v) => effect.includes(v));
  const hasForbiddenInEffect = FORBIDDEN_VOCAB.some((w) =>
    new RegExp(`\\b${w}\\b`, 'i').test(sm.readerEffect),
  );
  results.push({
    id: '6',
    name: 'Effect — readerEffect describes cognitive/felt effect (not praise)',
    passed: hasCognitive && !hasForbiddenInEffect,
    detail: `cognitive=${hasCognitive}, forbiddenVocab=${hasForbiddenInEffect ? 'present' : 'absent'}`,
  });

  // 7. Forbidden vocabulary — none of the praise words in oneSentenceName
  const found = FORBIDDEN_VOCAB.filter((w) =>
    new RegExp(`\\b${w}\\b`, 'i').test(sm.oneSentenceName),
  );
  results.push({
    id: '7',
    name: 'No forbidden vocabulary in oneSentenceName',
    passed: found.length === 0,
    detail: found.length === 0 ? 'clean' : `present: ${found.join(', ')}`,
  });

  // 8. No regression — the harness can't visual-diff, so we surface the dump
  // path and require the user to inspect. This criterion is informational
  // here; final pass is human-confirmed in Phase 11.
  results.push({
    id: '8',
    name: 'No regression in other dump sections (manual visual diff required)',
    passed: true,
    detail: 'see Phase 11 visual diff against tests/output/full-profile-*.md',
  });

  return results;
}

function renderSignatureMove(sm: SignatureMove | null | undefined): string {
  if (sm == null) return '(null — no signatureMove on profile)';
  const lines: string[] = [];
  lines.push(`> ${sm.oneSentenceName}`);
  lines.push('');
  lines.push(`**Why it is theirs**: ${sm.whyItIsTheirs}`);
  lines.push('');
  lines.push(`**Reader effect**: ${sm.readerEffect}`);
  lines.push('');
  lines.push('**Instances:**');
  for (let i = 0; i < sm.instances.length; i++) {
    const inst = sm.instances[i];
    if (inst.kind === 'sentence_quote') {
      const s = inst.location.sentence;
      const where = s != null ? `P${inst.location.paragraph + 1}S${s + 1}` : `P${inst.location.paragraph + 1}`;
      lines.push(`${i + 1}. [${inst.kind}] ${where}: "${inst.quotedText}" — ${inst.whatThisInstanceShows}`);
    } else if (inst.kind === 'paragraph_compression') {
      lines.push(`${i + 1}. [${inst.kind}] P${inst.paragraph + 1}: ${inst.whatThisInstanceShows}`);
    } else {
      lines.push(`${i + 1}. [${inst.kind}] P${inst.paragraphs.map((p) => p + 1).join(',')}: ${inst.whatThisInstanceShows}`);
    }
  }
  return lines.join('\n');
}

async function main(): Promise<void> {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const essayText = (await fs.readFile(ESSAY_PATH, 'utf-8')).trim();
  console.log(
    `[gap1-validation] Loaded ${ESSAY_LABEL}: ${essayText.length} chars, ${essayText.split(/\s+/).length} words`,
  );

  const startTime = Date.now();
  console.log('[gap1-validation] Running full pipeline (L1 → L4) via analysisOrchestrator...');

  const pipelineResult = await analysisOrchestrator.analyzeEssay({
    essayId: `gap1-validation-${ESSAY_LABEL}`,
    essayText,
    essayType: 'common_app',
    includeAnnotations: false,
  });

  const totalMs = Date.now() - startTime;
  const profile = pipelineResult.profile as EssayProfile;
  const totalCost = pipelineResult.costSummary.totalCost;

  console.log('');
  console.log(`[gap1-validation] Pipeline complete in ${fmtMs(totalMs)}`);
  console.log(`[gap1-validation] Layers completed: ${pipelineResult.layersCompleted.join(', ')}`);
  console.log(
    `[gap1-validation] Layers failed: ${
      pipelineResult.layersFailed.map((f) => `${f.layer}: ${f.message}`).join(', ') || 'none'
    }`,
  );
  console.log(`[gap1-validation] Total cost: ${fmtCost(totalCost)}`);

  const layers = pipelineResult.costSummary.layers ?? [];
  console.log('');
  console.log('[gap1-validation] Per-layer cost breakdown:');
  for (const l of layers) {
    console.log(`  ${l.layer.padEnd(35)} ${fmtCost(l.cost).padEnd(10)} ${fmtMs(l.timingMs)}`);
  }

  const sm = profile.craftAssessment?.signatureMove ?? null;
  const paragraphTexts = profile.paragraphs.map((p) => p.text);

  console.log('');
  console.log('[gap1-validation] === SignatureMove output ===');
  console.log(renderSignatureMove(sm));

  console.log('');
  console.log('[gap1-validation] === Pass criteria evaluation ===');
  const criteria = evaluateCriteria(sm, paragraphTexts);
  let pass = 0;
  for (const c of criteria) {
    const tag = c.passed ? '✓' : '✗';
    console.log(`  [${tag}] ${c.id}. ${c.name} — ${c.detail}`);
    if (c.passed) pass += 1;
  }
  console.log('');
  console.log(`[gap1-validation] Criteria: ${pass}/${criteria.length} passed`);

  // Write report
  await fs.mkdir(OUTPUT_DIR, { recursive: true });
  const reportPath = path.join(
    OUTPUT_DIR,
    `signature-move-${ESSAY_LABEL}-${new Date().toISOString().replace(/[:.]/g, '-')}.md`,
  );
  const lines: string[] = [];
  lines.push(`# Quality Gap 1 — SignatureMove validation report`);
  lines.push('');
  lines.push(`- **Essay**: ${ESSAY_FILENAME}`);
  lines.push(`- **Date**: ${new Date().toISOString()}`);
  lines.push(`- **Time**: ${fmtMs(totalMs)} | **Cost**: ${fmtCost(totalCost)}`);
  lines.push(`- **Layers completed**: ${pipelineResult.layersCompleted.join(', ')}`);
  lines.push('');
  lines.push('## Per-layer cost breakdown');
  lines.push('');
  lines.push('| Layer | Cost | Time |');
  lines.push('|---|---|---|');
  for (const l of layers) {
    lines.push(`| ${l.layer} | ${fmtCost(l.cost)} | ${fmtMs(l.timingMs)} |`);
  }
  lines.push('');
  lines.push('## SignatureMove output');
  lines.push('');
  lines.push(renderSignatureMove(sm));
  lines.push('');
  lines.push('## Pass criteria');
  lines.push('');
  lines.push('| # | Criterion | Result | Detail |');
  lines.push('|---|---|---|---|');
  for (const c of criteria) {
    lines.push(
      `| ${c.id} | ${c.name.replace(/\|/g, '\\|')} | ${c.passed ? 'PASS' : 'FAIL'} | ${c.detail.replace(/\|/g, '\\|')} |`,
    );
  }
  lines.push('');
  lines.push(`**${pass}/${criteria.length} passed**`);
  await fs.writeFile(reportPath, lines.join('\n'), 'utf-8');
  console.log(`[gap1-validation] Report written: ${reportPath}`);

  if (totalCost >= COST_HARD_CAP_USD) {
    console.error(`[gap1-validation] FAIL: total cost ${fmtCost(totalCost)} ≥ $${COST_HARD_CAP_USD} hard cap`);
    process.exit(1);
  }

  // Exit nonzero if criteria failed (excluding the informational #8)
  const blockingFails = criteria.filter((c) => !c.passed && c.id !== '8').length;
  if (blockingFails > 0) {
    process.exit(1);
  }
}

main().catch((err) => {
  console.error('[gap1-validation] FATAL:', err);
  process.exit(1);
});
