/**
 * Phase B Synthesis Dump — runs the full pipeline on fixture 05 (the
 * craft-phase essay that originally triggered the 7K→10K truncation bug)
 * and persists the complete holistic synthesis JSON so we can inspect
 * which sections fit inside the 10K ceiling.
 *
 * Usage:
 *   ANTHROPIC_API_KEY="$ANTHROPIC_API_KEY" npx tsx tests/dump-phase-b.ts
 */
import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const { analysisOrchestrator } = await import('../src/services/essayIntelligence/analysis/analysisOrchestrator');

const FIXTURE = '05-harvard-2028-i-too-can-dance';
const ESSAY_PATH = path.join(
  __dirname,
  'calibration',
  'top-tier-reference',
  'essays',
  `${FIXTURE}.txt`,
);
const OUTPUT_PATH = path.join(__dirname, 'output', 'phase-b-dump.json');

async function main() {
  const essayText = fs.readFileSync(ESSAY_PATH, 'utf8').trim();
  const start = Date.now();
  const result = await analysisOrchestrator.analyzeEssay({
    essayId: FIXTURE,
    essayText,
    essayType: 'common_app',
    includeAnnotations: false,
  });
  const ms = Date.now() - start;

  const p = result.profile;
  const dump = {
    fixture: FIXTURE,
    elapsedMs: ms,
    costUsd: result.costSummary.totalCost,
    layersFailed: result.layersFailed ?? [],
    sectionSizes: {
      voiceIdentity: jsonSize(p.voiceIdentity),
      voiceMap: jsonSize(p.voiceMap),
      emotionalTopography: jsonSize(p.emotionalTopography),
      momentEarnednessMap: jsonSize(p.momentEarnednessMap),
      thematicArchitecture: jsonSize(p.thematicArchitecture),
      narrativeStrategy: jsonSize(p.narrativeStrategy),
      characterRevelation: jsonSize(p.characterRevelation),
      craftAssessment: jsonSize(p.craftAssessment),
      admissionsPositioning: jsonSize(p.admissionsPositioning),
      entanglements: {
        count: p.entanglements?.length ?? 0,
        bytes: jsonSize(p.entanglements).bytes,
      },
    },
    phaseBSections: {
      thematicArchitecture: p.thematicArchitecture,
      narrativeStrategy: p.narrativeStrategy,
      characterRevelation: p.characterRevelation,
      craftAssessment: p.craftAssessment,
      admissionsPositioning: p.admissionsPositioning,
      entanglements: p.entanglements,
    },
  };

  fs.mkdirSync(path.dirname(OUTPUT_PATH), { recursive: true });
  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(dump, null, 2), 'utf8');
  console.log(`\n✓ Dumped to ${OUTPUT_PATH}`);
  console.log(`  cost=$${result.costSummary.totalCost.toFixed(4)} time=${(ms / 1000).toFixed(1)}s`);
  console.log(`  layersFailed=${(result.layersFailed ?? []).length}`);
}

function jsonSize(v: unknown): { bytes: number; keys: number | null } {
  if (v === null || v === undefined) return { bytes: 0, keys: null };
  const s = JSON.stringify(v);
  const keys = typeof v === 'object' && !Array.isArray(v) ? Object.keys(v as object).length : null;
  return { bytes: s.length, keys };
}

main().catch(err => {
  console.error('[dump-phase-b] Failed:', err);
  process.exit(1);
});
